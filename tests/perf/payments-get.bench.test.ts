/**
 * @jest-environment node
 */

/**
 * Opt-in benchmark for GET /api/spacehub/payment (the `getPayments` flow).
 *
 * Skipped unless PAYMENTS_BENCH=1, so `yarn test` and CI never seed the big
 * dataset or depend on timings. It calls the real API handler against an
 * in-memory mongod and reports, per scenario:
 *   - every MongoDB command the request sent (driver command monitoring),
 *   - each command re-run with `explain` (executionStats): plan stages
 *     (COLLSCAN / IXSCAN + index name), totalDocsExamined, totalKeysExamined,
 *     nReturned,
 *   - server-side duration of each command and wall time of the handler
 *     (median of N runs, in-process: no network, no Next.js server),
 *   - response size and a fingerprint of the response body, so a later run can
 *     prove the optimisation did not change what the endpoint returns.
 *
 * The data is synthetic (seeded PRNG, fixed dates and ids): the numbers
 * describe this dataset on this machine, not production.
 *
 *   PAYMENTS_BENCH=1 npx jest tests/perf/payments-get.bench.test.ts
 *
 * Env:
 *   PAYMENTS_BENCH_OUT=<file.json>       write the full report as JSON
 *   PAYMENTS_BENCH_BASELINE=<file.json>  print before/after deltas against an
 *                                        earlier report
 *   PAYMENTS_BENCH_WHAT_IF=1             also create the candidate Payment
 *                                        indexes below, in this in-memory DB
 *                                        only (no schema change); or a JSON
 *                                        array of index keys to try instead
 *   PAYMENTS_BENCH_DOMAINS (10), PAYMENTS_BENCH_COMPANIES per domain (30),
 *   PAYMENTS_BENCH_MONTHS (36), PAYMENTS_BENCH_RUNS (5)
 */

import { createHash } from 'crypto'
import { readFileSync, writeFileSync } from 'fs'
import { performance } from 'perf_hooks'

import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose, { Types } from 'mongoose'
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'

import Domain from '@modules/models/Domain'
import Payment from '@modules/models/Payment'
import RealEstate from '@modules/models/RealEstate'
import Service from '@modules/models/Service'
import Street from '@modules/models/Street'
import User from '@modules/models/User'
import handler from '@pages/api/spacehub/payment'
import { testConnectOptions } from '@utils/setupTestEnvironment'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => ({
  __esModule: true,
  default: jest.fn(),
}))

const ENABLED = process.env.PAYMENTS_BENCH === '1'

const envNumber = (name: string, fallback: number): number => {
  const value = Number(process.env[name])
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback
}

const DOMAINS = envNumber('PAYMENTS_BENCH_DOMAINS', 10)
const COMPANIES_PER_DOMAIN = envNumber('PAYMENTS_BENCH_COMPANIES', 30)
const MONTHS = envNumber('PAYMENTS_BENCH_MONTHS', 36)
const RUNS = envNumber('PAYMENTS_BENCH_RUNS', 5)
const FIRST_YEAR = 2023

/** Candidate indexes tried by PAYMENTS_BENCH_WHAT_IF=1. */
const DEFAULT_WHAT_IF_INDEXES: Record<string, 1 | -1>[] = [
  { company: 1, invoiceCreationDate: -1 },
  { domain: 1, invoiceCreationDate: -1 },
]

type Role = 'globalAdmin' | 'domainAdmin' | 'user'

const EMAIL: Record<Role, string> = {
  globalAdmin: 'bench-global@bench.test',
  domainAdmin: 'bench-domain-admin@bench.test',
  user: 'bench-company-user@bench.test',
}

// ---------------------------------------------------------------- dataset --

/** Deterministic ids, so response fingerprints compare across runs. */
const KIND = {
  domain: 1,
  street: 2,
  company: 3,
  service: 4,
  payment: 5,
  user: 6,
} as const

const oid = (kind: number, n: number): Types.ObjectId =>
  new Types.ObjectId(
    kind.toString(16).padStart(2, '0') + n.toString(16).padStart(22, '0')
  )

const domainId = (d: number) => oid(KIND.domain, d)
const companyId = (d: number, c: number) =>
  oid(KIND.company, d * COMPANIES_PER_DOMAIN + c)
const serviceId = (d: number, m: number) => oid(KIND.service, d * MONTHS + m)

function mulberry32(seed: number): () => number {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const round2 = (value: number) => Math.round(value * 100) / 100
const DAY_MS = 24 * 60 * 60 * 1000

/** Month `m` counted from January FIRST_YEAR; Date.UTC rolls the year over. */
const monthYear = (m: number) => FIRST_YEAR + Math.floor(m / 12)
const monthNumber = (m: number) => (m % 12) + 1

interface SeedSummary {
  domains: number
  companies: number
  services: number
  payments: number
}

async function insertInChunks(
  collection: mongoose.mongo.Collection,
  docs: Record<string, unknown>[]
) {
  const CHUNK = 5000
  for (let i = 0; i < docs.length; i += CHUNK) {
    await collection.insertMany(docs.slice(i, i + CHUNK), { ordered: false })
  }
}

async function seed(): Promise<SeedSummary> {
  const rand = mulberry32(20261105)
  const streets: Record<string, unknown>[] = []
  const domains: Record<string, unknown>[] = []
  const companies: Record<string, unknown>[] = []
  const services: Record<string, unknown>[] = []
  const payments: Record<string, unknown>[] = []
  let invoiceNumber = 1

  for (let d = 0; d < DOMAINS; d++) {
    const domainStreets = [oid(KIND.street, d * 2), oid(KIND.street, d * 2 + 1)]
    domainStreets.forEach((_id, i) =>
      streets.push({ _id, address: `Bench street ${d}-${i}`, city: 'Київ' })
    )
    domains.push({
      _id: domainId(d),
      name: `Bench domain ${d}`,
      adminEmails: [d === 0 ? EMAIL.domainAdmin : `owner-${d}@bench.test`],
      streets: domainStreets,
      description: 'bench',
      domainServices: [],
      customServices: [],
      disabledServiceIds: [],
      archived: false,
    })

    for (let m = 0; m < MONTHS; m++) {
      services.push({
        _id: serviceId(d, m),
        domain: domainId(d),
        date: new Date(Date.UTC(FIRST_YEAR, m, 15)),
        rentPrice: 100,
        electricityPrice: 5,
        waterPrice: 30,
        waterPriceTotal: 0,
        garbageCollectorPrice: 0,
        inflicionPrice: 0,
        description: '',
        customServices: [],
        losses: 0,
        isVAT: true,
      })
    }

    for (let c = 0; c < COMPANIES_PER_DOMAIN; c++) {
      const n = d * COMPANIES_PER_DOMAIN + c
      const area = 50 + c * 3
      const street = domainStreets[c % 2]
      const companyName = `Bench company ${n}`
      const adminEmails = [n === 0 ? EMAIL.user : `tenant-${n}@bench.test`]
      companies.push({
        _id: companyId(d, c),
        domain: domainId(d),
        street,
        companyName,
        description: '',
        adminEmails,
        pricePerMeter: 50,
        totalArea: area,
        rentPart: 0,
        waterPart: 0,
        cleaning: 0,
        discount: 0,
        inflicion: false,
        garbageCollector: false,
        archived: false,
        allServices: false,
        services: [],
        customServices: [],
      })

      const provider = {
        name: `Bench domain ${d}`,
        description: `ФОП Bench ${d}, IBAN UA00000000000000000000000${d}`,
      }
      const reciever = { companyName, adminEmails, description: '' }

      for (let m = 0; m < MONTHS; m++) {
        const created = new Date(
          Date.UTC(
            FIRST_YEAR,
            m,
            1 + Math.floor(rand() * 25),
            8 + Math.floor(rand() * 10)
          )
        )
        const used = 100 + Math.floor(rand() * 400)
        const water = 1 + Math.floor(rand() * 20)
        const invoice: Record<string, unknown>[] = [
          {
            type: 'maintenancePrice',
            amount: area,
            price: 50,
            sum: round2(area * 50),
          },
          {
            type: 'electricityPrice',
            lastAmount: 1000 + m * 300,
            amount: 1000 + m * 300 + used,
            price: 5,
            sum: round2(used * 5),
          },
          { type: 'waterPrice', amount: water, price: 30, sum: water * 30 },
        ]
        if (rand() < 0.3) {
          invoice.push({
            type: 'custom',
            name: 'Охорона',
            price: 200,
            sum: 200,
          })
        }
        const generalSum = round2(
          invoice.reduce((acc, line) => acc + Number(line.sum), 0)
        )

        // Saved through the API the id is a string; older rows hold an
        // ObjectId; a few have none - the shapes getPayments has to match.
        const shape = rand()
        const monthService =
          shape < 0.85
            ? serviceId(d, m).toHexString()
            : shape < 0.95
              ? serviceId(d, m)
              : undefined
        const statusRoll = rand()
        const status =
          statusRoll < 0.6 ? 'sent' : statusRoll < 0.85 ? 'draft' : undefined

        const base = {
          domain: domainId(d),
          street,
          company: companyId(d, c),
          ...(monthService !== undefined ? { monthService } : {}),
          description: '',
          provider,
          reciever,
          currency: 'UAH',
          template: 'classic',
        }

        payments.push({
          _id: oid(KIND.payment, payments.length),
          ...base,
          invoiceNumber: invoiceNumber++,
          type: 'debit',
          ...(status ? { status } : {}),
          invoiceCreationDate: created,
          invoice,
          generalSum,
        })

        if (rand() < 0.8) {
          payments.push({
            _id: oid(KIND.payment, payments.length),
            ...base,
            invoiceNumber: invoiceNumber++,
            type: 'credit',
            invoiceCreationDate: new Date(created.getTime() + 1),
            paidAt: new Date(
              created.getTime() + (1 + Math.floor(rand() * 20)) * DAY_MS
            ),
            invoice: [],
            generalSum: rand() < 0.85 ? generalSum : round2(generalSum / 2),
          })
        }
      }
    }
  }

  await insertInChunks(Street.collection, streets)
  await insertInChunks(Domain.collection, domains)
  await insertInChunks(RealEstate.collection, companies)
  await insertInChunks(Service.collection, services)
  await insertInChunks(Payment.collection, payments)
  await User.collection.insertMany([
    {
      _id: oid(KIND.user, 1),
      name: 'Bench global admin',
      email: EMAIL.globalAdmin,
      roles: ['GlobalAdmin'],
    },
    {
      _id: oid(KIND.user, 2),
      name: 'Bench domain admin',
      email: EMAIL.domainAdmin,
      roles: ['DomainAdmin'],
    },
    {
      _id: oid(KIND.user, 3),
      name: 'Bench company user',
      email: EMAIL.user,
      roles: ['User'],
    },
  ])

  return {
    domains: domains.length,
    companies: companies.length,
    services: services.length,
    payments: payments.length,
  }
}

// -------------------------------------------------------------- scenarios --

interface Scenario {
  name: string
  /** Where in the client this request shape comes from. */
  source: string
  role: Role
  query: Record<string, string>
}

/** Query strings exactly as RTK Query sends them (arrays comma-joined). */
function scenarios(): Scenario[] {
  const lastYear = monthYear(MONTHS - 1)
  const lastMonth = monthNumber(MONTHS - 1)
  const allCompaniesOfDomain0 = Array.from(
    { length: COMPANIES_PER_DOMAIN },
    (_, c) => companyId(0, c).toHexString()
  ).join(',')
  const rangeFrom = new Date(Date.UTC(lastYear, lastMonth - 3, 1))
  const rangeTo = new Date(Date.UTC(lastYear, lastMonth, 1) - 1)

  return [
    {
      name: 'table, GlobalAdmin, page 1, no filters',
      source: 'DashboardPage/blocks/payments.tsx',
      role: 'globalAdmin',
      query: { limit: '10', skip: '0', dateField: 'invoiceCreationDate' },
    },
    {
      name: 'table, GlobalAdmin, filter: 1 domain',
      source: 'DashboardPage/blocks/payments.tsx',
      role: 'globalAdmin',
      query: {
        limit: '10',
        skip: '0',
        dateField: 'invoiceCreationDate',
        domainIds: domainId(0).toHexString(),
      },
    },
    {
      name: 'table, GlobalAdmin, 1 domain + date range',
      source: 'DashboardPage/blocks/payments.tsx (За проміжок)',
      role: 'globalAdmin',
      query: {
        limit: '10',
        skip: '0',
        dateField: 'invoiceCreationDate',
        domainIds: domainId(0).toHexString(),
        dateFrom: rangeFrom.toISOString(),
        dateTo: rangeTo.toISOString(),
      },
    },
    {
      name: 'table, GlobalAdmin, 1 company + date range',
      source: 'DashboardPage/blocks/payments.tsx (За проміжок)',
      role: 'globalAdmin',
      query: {
        limit: '10',
        skip: '0',
        dateField: 'invoiceCreationDate',
        companyIds: companyId(3, 7).toHexString(),
        dateFrom: rangeFrom.toISOString(),
        dateTo: rangeTo.toISOString(),
      },
    },
    {
      name: 'table, DomainAdmin, page 1',
      source: 'DashboardPage/blocks/payments.tsx',
      role: 'domainAdmin',
      query: { limit: '10', skip: '0', dateField: 'invoiceCreationDate' },
    },
    {
      name: 'table, User (company admin), page 1',
      source: 'DashboardPage/blocks/payments.tsx',
      role: 'user',
      query: { limit: '10', skip: '0', dateField: 'invoiceCreationDate' },
    },
    {
      name: 'last invoice of a month (limit 1, year/month $expr)',
      source: 'modules/hooks/usePayment.ts',
      role: 'globalAdmin',
      query: {
        companyIds: companyId(3, 7).toHexString(),
        month: String(lastMonth),
        year: String(lastYear),
        limit: '1',
        type: 'debit',
      },
    },
    {
      name: 'previous payment by month service (limit 1)',
      source: 'modules/hooks/usePaymentData.ts',
      role: 'globalAdmin',
      query: {
        companyIds: companyId(3, 7).toHexString(),
        domainIds: domainId(3).toHexString(),
        serviceIds: serviceId(3, MONTHS - 2).toHexString(),
        type: 'debit',
        limit: '1',
      },
    },
    {
      name: 'bulk prefill: domain companies by month service',
      source: 'DashboardPage/blocks/paymentsBulk.tsx',
      role: 'globalAdmin',
      query: {
        domainIds: domainId(0).toHexString(),
        companyIds: allCompaniesOfDomain0,
        serviceIds: serviceId(0, MONTHS - 1).toHexString(),
        type: 'debit',
        limit: String(COMPANIES_PER_DOMAIN + 1),
      },
    },
    {
      name: 'profit drilldown: domain, month by month service',
      source: 'ProfiitPage/components/PaymentsDrilldown',
      role: 'globalAdmin',
      query: {
        limit: '100',
        type: 'credit',
        domainIds: domainId(0).toHexString(),
        year: String(lastYear),
        month: String(lastMonth),
        dateField: 'date',
      },
    },
  ]
}

// ------------------------------------------------------------ measurement --

type Json = Record<string, unknown>
const isObject = (value: unknown): value is Json =>
  !!value && typeof value === 'object' && !Array.isArray(value)

const DATA_COMMANDS = new Set([
  'find',
  'aggregate',
  'count',
  'distinct',
  'getMore',
  'insert',
  'update',
  'delete',
  'findAndModify',
])
const EXPLAINABLE = new Set(['find', 'aggregate', 'count', 'distinct'])
/** Session/transport fields the explain wrapper must not repeat. */
const NOT_EXPLAINABLE_FIELDS = new Set([
  'lsid',
  'txnNumber',
  'autocommit',
  'startTransaction',
  'readConcern',
  'writeConcern',
  'apiVersion',
  'apiStrict',
  'apiDeprecationErrors',
])

interface CapturedCommand {
  requestId: number
  name: string
  collection: string
  command: Json
  durationMs?: number
}

interface CommandReport {
  collection: string
  name: string
  durationMs: number | null
  stages: string[]
  indexes: string[]
  docsExamined: number | null
  keysExamined: number | null
  nReturned: number | null
}

interface ScenarioReport {
  name: string
  source: string
  role: Role
  query: Record<string, string>
  status: number
  rows: number
  total: number | null
  responseBytes: number
  fingerprint: string
  wallMs: { median: number; min: number; max: number; runs: number[] }
  ops: {
    total: number
    byCollection: Record<string, number>
    byCommand: Record<string, number>
  }
  payments: {
    ops: number
    docsExamined: number
    keysExamined: number
    collscans: number
    ixscans: number
  }
  commands: CommandReport[]
}

interface BenchReport {
  createdAt: string
  mongodVersion: string
  dataset: SeedSummary & { months: number; runsPerScenario: number }
  paymentIndexes: string[]
  /** Bytes, from $collStats storageStats (WiredTiger, uncompressed data). */
  paymentStorage: {
    dataSize: number
    avgObjSize: number
    totalIndexSize: number
    indexSizes: Record<string, number>
  }
  whatIfIndexes: Record<string, 1 | -1>[] | null
  scenarios: ScenarioReport[]
}

let capturing = false
let captured: CapturedCommand[] = []

function attachCommandMonitor(client: mongoose.mongo.MongoClient) {
  client.on('commandStarted', (event) => {
    if (!capturing || !DATA_COMMANDS.has(event.commandName)) return
    const command = event.command as Json
    const target =
      event.commandName === 'getMore'
        ? command.collection
        : command[event.commandName]
    captured.push({
      requestId: event.requestId,
      name: event.commandName,
      collection: typeof target === 'string' ? target : '?',
      command,
    })
  })
  client.on('commandSucceeded', (event) => {
    const record = captured.find((c) => c.requestId === event.requestId)
    if (record) record.durationMs = event.duration
  })
}

/** First executionStats carrying totalDocsExamined, breadth-first. */
function findExecutionStats(root: unknown): Json | undefined {
  const queue: unknown[] = [root]
  while (queue.length) {
    const node = queue.shift()
    if (Array.isArray(node)) {
      queue.push(...node)
      continue
    }
    if (!isObject(node)) continue
    const stats = node.executionStats
    if (isObject(stats) && typeof stats.totalDocsExamined === 'number') {
      return stats
    }
    for (const [key, value] of Object.entries(node)) {
      if (key !== 'rejectedPlans' && key !== 'allPlansExecution') {
        queue.push(value)
      }
    }
  }
  return undefined
}

/** Stage and index names of every winning plan in an explain output. */
function collectPlan(root: unknown): { stages: string[]; indexes: string[] } {
  const stages = new Set<string>()
  const indexes = new Set<string>()
  const visit = (node: unknown, inPlan: boolean) => {
    if (Array.isArray(node)) {
      node.forEach((child) => visit(child, inPlan))
      return
    }
    if (!isObject(node)) return
    for (const [key, value] of Object.entries(node)) {
      if (
        key === 'rejectedPlans' ||
        key === 'allPlansExecution' ||
        key === 'slotBasedPlan'
      ) {
        continue
      }
      if (inPlan && key === 'stage' && typeof value === 'string') {
        stages.add(value)
      }
      if (inPlan && key === 'indexName' && typeof value === 'string') {
        indexes.add(value)
      }
      visit(value, inPlan || key === 'winningPlan')
    }
  }
  visit(root, false)
  return { stages: [...stages].sort(), indexes: [...indexes].sort() }
}

async function explainCommand(record: CapturedCommand): Promise<CommandReport> {
  const base: CommandReport = {
    collection: record.collection,
    name: record.name,
    durationMs: record.durationMs ?? null,
    stages: [],
    indexes: [],
    docsExamined: null,
    keysExamined: null,
    nReturned: null,
  }
  const db = mongoose.connection.db
  if (!EXPLAINABLE.has(record.name) || !db) return base

  const inner = Object.fromEntries(
    Object.entries(record.command).filter(
      ([key]) => !key.startsWith('$') && !NOT_EXPLAINABLE_FIELDS.has(key)
    )
  )
  const explain = await db.command({
    explain: inner,
    verbosity: 'executionStats',
  })
  const stats = findExecutionStats(explain)
  const plan = collectPlan(explain)
  const num = (value: unknown) => (typeof value === 'number' ? value : null)
  return {
    ...base,
    stages: plan.stages,
    indexes: plan.indexes,
    docsExamined: num(stats?.totalDocsExamined),
    keysExamined: num(stats?.totalKeysExamined),
    nReturned: num(stats?.nReturned),
  }
}

/** Key-sorted, number-rounded JSON: $group output order and the last bits of
 * a floating-point $sum may legitimately vary with the plan; neither is
 * visible to the client, which rounds money to 2 decimals. */
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical)
  if (isObject(value)) {
    return Object.keys(value)
      .sort()
      .reduce<Json>((acc, key) => {
        acc[key] = canonical(value[key])
        return acc
      }, {})
  }
  if (typeof value === 'number') return Math.round(value * 1e6) / 1e6
  return value
}

interface HandlerResult {
  ms: number
  status: number
  body: unknown
  json: string
}

async function callHandler(
  role: Role,
  query: Record<string, string>
): Promise<HandlerResult> {
  ;(getServerSession as jest.Mock).mockResolvedValue({
    user: { email: EMAIL[role] },
  })
  const result = { status: 0, body: undefined as unknown }
  const res = {
    status(code: number) {
      result.status = code
      return res
    },
    json(body: unknown) {
      result.body = body
      return res
    },
  }
  const req = { method: 'GET', query, headers: {} }

  const started = performance.now()
  // Why: the handler only reads method/query and calls status().json(); a
  // full IncomingMessage/ServerResponse pair is not needed to drive it.
  await handler(
    req as unknown as NextApiRequest,
    res as unknown as NextApiResponse
  )
  // Next.js serialises the body inside res.json - include that cost.
  const json = JSON.stringify(result.body)
  const ms = performance.now() - started
  return { ms, status: result.status, body: result.body, json }
}

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

const round1 = (value: number) => Math.round(value * 10) / 10

async function measure(scenario: Scenario): Promise<ScenarioReport> {
  await callHandler(scenario.role, scenario.query) // warm-up

  captured = []
  capturing = true
  const first = await callHandler(scenario.role, scenario.query)
  capturing = false
  const records = captured
  captured = []

  const runs = [first.ms]
  for (let i = 1; i < RUNS; i++) {
    runs.push((await callHandler(scenario.role, scenario.query)).ms)
  }

  const commands: CommandReport[] = []
  for (const record of records) commands.push(await explainCommand(record))

  const count = (key: (c: CommandReport) => string) =>
    commands.reduce<Record<string, number>>((acc, c) => {
      acc[key(c)] = (acc[key(c)] ?? 0) + 1
      return acc
    }, {})
  const onPayments = commands.filter(
    (c) => c.collection === Payment.collection.collectionName
  )
  const sum = (key: 'docsExamined' | 'keysExamined') =>
    onPayments.reduce((acc, c) => acc + (c[key] ?? 0), 0)

  const body = isObject(first.body) ? first.body : {}
  const parsed = JSON.parse(first.json ?? 'null')
  return {
    name: scenario.name,
    source: scenario.source,
    role: scenario.role,
    query: scenario.query,
    status: first.status,
    rows: Array.isArray(body.data) ? body.data.length : 0,
    total: typeof body.total === 'number' ? body.total : null,
    responseBytes: Buffer.byteLength(first.json ?? ''),
    fingerprint: createHash('sha256')
      .update(JSON.stringify(canonical(parsed)))
      .digest('hex')
      .slice(0, 16),
    wallMs: {
      median: round1(median(runs)),
      min: round1(Math.min(...runs)),
      max: round1(Math.max(...runs)),
      runs: runs.map(round1),
    },
    ops: {
      total: commands.length,
      byCollection: count((c) => c.collection),
      byCommand: count((c) => c.name),
    },
    payments: {
      ops: onPayments.length,
      docsExamined: sum('docsExamined'),
      keysExamined: sum('keysExamined'),
      collscans: onPayments.filter((c) => c.stages.includes('COLLSCAN')).length,
      ixscans: onPayments.filter((c) => c.stages.includes('IXSCAN')).length,
    },
    commands,
  }
}

// ---------------------------------------------------------------- output --

const out = (line = '') => process.stdout.write(`${line}\n`)
const pad = (value: unknown, width: number) =>
  String(value ?? '-').padEnd(width)
const padStart = (value: unknown, width: number) =>
  String(value ?? '-').padStart(width)

function printReport(report: BenchReport) {
  const { dataset } = report
  out()
  out(`GET /api/spacehub/payment benchmark - mongod ${report.mongodVersion}`)
  out(
    `dataset (synthetic): ${dataset.payments} payments, ${dataset.companies} companies, ` +
      `${dataset.domains} domains, ${dataset.services} month services, ${dataset.months} months; ` +
      `${dataset.runsPerScenario} timed runs per scenario`
  )
  out(`payments indexes: ${report.paymentIndexes.join(' | ')}`)
  out(
    `payments storage: data ${report.paymentStorage.dataSize} B ` +
      `(avg doc ${report.paymentStorage.avgObjSize} B), indexes ` +
      `${report.paymentStorage.totalIndexSize} B ` +
      JSON.stringify(report.paymentStorage.indexSizes)
  )
  if (report.whatIfIndexes) {
    out(`what-if indexes: ${JSON.stringify(report.whatIfIndexes)}`)
  }

  for (const s of report.scenarios) {
    out()
    out(`## ${s.name}  [${s.role}]  (${s.source})`)
    out(
      `   status ${s.status}, rows ${s.rows}, total ${s.total}, ` +
        `response ${s.responseBytes} B, fingerprint ${s.fingerprint}`
    )
    out(
      `   wall ms: median ${s.wallMs.median} (min ${s.wallMs.min}, max ${s.wallMs.max})`
    )
    out(
      `   ops: ${s.ops.total} total ${JSON.stringify(s.ops.byCollection)} ` +
        `${JSON.stringify(s.ops.byCommand)}`
    )
    out(
      `   payments: ${s.payments.ops} ops, docsExamined ${s.payments.docsExamined}, ` +
        `keysExamined ${s.payments.keysExamined}, COLLSCAN ${s.payments.collscans}, ` +
        `IXSCAN ${s.payments.ixscans}`
    )
    out(
      `   ${pad('#', 3)}${pad('collection', 14)}${pad('command', 10)}` +
        `${padStart('ms', 8)}${padStart('docsExam', 10)}${padStart('keysExam', 10)}` +
        `${padStart('nReturned', 10)}  plan`
    )
    s.commands.forEach((c, i) => {
      const plan = c.stages.length
        ? c.stages.join(',') +
          (c.indexes.length ? ` [${c.indexes.join(',')}]` : '')
        : '-'
      out(
        `   ${pad(i + 1, 3)}${pad(c.collection, 14)}${pad(c.name, 10)}` +
          `${padStart(c.durationMs === null ? '-' : c.durationMs.toFixed(1), 8)}` +
          `${padStart(c.docsExamined, 10)}${padStart(c.keysExamined, 10)}` +
          `${padStart(c.nReturned, 10)}  ${plan}`
      )
    })
  }
}

function printComparison(before: BenchReport, after: BenchReport) {
  out()
  out(`BEFORE (${before.createdAt}) -> AFTER (${after.createdAt})`)
  out(`before indexes: ${before.paymentIndexes.join(' | ')}`)
  out(`after indexes:  ${after.paymentIndexes.join(' | ')}`)
  if (before.dataset.payments !== after.dataset.payments) {
    out('WARNING: datasets differ - the comparison is not like for like')
  }
  out(
    `${pad('scenario', 54)}${padStart('ops', 10)}${padStart('pay.docsExam', 18)}` +
      `${padStart('COLLSCAN', 10)}${padStart('median ms', 16)}  response`
  )
  for (const a of after.scenarios) {
    const b = before.scenarios.find((s) => s.name === a.name)
    if (!b) {
      out(`${pad(a.name, 54)}  (not in baseline)`)
      continue
    }
    const arrow = (x: number, y: number) => `${x}->${y}`
    out(
      `${pad(a.name.slice(0, 53), 54)}` +
        `${padStart(arrow(b.ops.total, a.ops.total), 10)}` +
        `${padStart(arrow(b.payments.docsExamined, a.payments.docsExamined), 18)}` +
        `${padStart(arrow(b.payments.collscans, a.payments.collscans), 10)}` +
        `${padStart(arrow(b.wallMs.median, a.wallMs.median), 16)}  ` +
        (b.fingerprint === a.fingerprint ? 'identical' : 'DIFFERENT')
    )
  }
}

function whatIfIndexes(): Record<string, 1 | -1>[] | null {
  const raw = process.env.PAYMENTS_BENCH_WHAT_IF
  if (!raw) return null
  if (raw === '1') return DEFAULT_WHAT_IF_INDEXES
  const parsed: unknown = JSON.parse(raw)
  if (!Array.isArray(parsed)) {
    throw new Error('PAYMENTS_BENCH_WHAT_IF must be 1 or a JSON array')
  }
  return parsed as Record<string, 1 | -1>[]
}

// ----------------------------------------------------------------- runner --

const describeBench = ENABLED ? describe : describe.skip

describeBench('benchmark: GET /api/spacehub/payment', () => {
  jest.setTimeout(600000)

  let mongo: MongoMemoryServer
  let dataset: SeedSummary

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create({
      instance: { launchTimeout: 60000 },
    })
    await mongoose.connect(mongo.getUri(), {
      ...testConnectOptions,
      monitorCommands: true,
    })
    await Promise.all(
      [Payment, Domain, RealEstate, Service, Street, User].map((model) =>
        model.init()
      )
    )
    dataset = await seed()
    // Exactly the indexes the Payment schema declares - so the same file
    // measures BEFORE and AFTER a schema change.
    await Payment.syncIndexes()
    for (const key of whatIfIndexes() ?? []) {
      await Payment.collection.createIndex(key)
    }
    attachCommandMonitor(mongoose.connection.getClient())
  }, 600000)

  afterAll(async () => {
    await mongoose.disconnect()
    await mongo?.stop()
  })

  it('measures every scenario', async () => {
    const reports: ScenarioReport[] = []
    for (const scenario of scenarios()) {
      const report = await measure(scenario)
      expect(report.status).toBe(200)
      reports.push(report)
    }

    const db = mongoose.connection.db
    const serverInfo = db ? await db.admin().serverInfo() : {}
    const indexes = await Payment.collection.indexes()
    const [collStats] = await Payment.collection
      .aggregate<{ storageStats: Json }>([{ $collStats: { storageStats: {} } }])
      .toArray()
    const storage = collStats?.storageStats ?? {}
    const report: BenchReport = {
      createdAt: new Date().toISOString(),
      mongodVersion: String(serverInfo.version ?? 'unknown'),
      dataset: { ...dataset, months: MONTHS, runsPerScenario: RUNS },
      paymentIndexes: indexes.map((index) => JSON.stringify(index.key)),
      paymentStorage: {
        dataSize: Number(storage.size ?? 0),
        avgObjSize: Number(storage.avgObjSize ?? 0),
        totalIndexSize: Number(storage.totalIndexSize ?? 0),
        indexSizes: isObject(storage.indexSizes)
          ? Object.fromEntries(
              Object.entries(storage.indexSizes).map(([k, v]) => [k, Number(v)])
            )
          : {},
      },
      whatIfIndexes: whatIfIndexes(),
      scenarios: reports,
    }

    printReport(report)

    const baselinePath = process.env.PAYMENTS_BENCH_BASELINE
    if (baselinePath) {
      const before = JSON.parse(readFileSync(baselinePath, 'utf8'))
      printComparison(before as BenchReport, report)
    }

    const outPath = process.env.PAYMENTS_BENCH_OUT
    if (outPath) {
      writeFileSync(outPath, JSON.stringify(report, null, 2))
      out(`\nreport written to ${outPath}`)
    }
  })
})
