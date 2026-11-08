/**
 * @jest-environment node
 */

/**
 * The figures beside the payments table (total, distinct domain/company
 * counts, credit/debit/general sums, per-service totals) come from one $facet
 * aggregation. They used to be six separate reads - countDocuments, two
 * distinct and three aggregations. `legacyStats` below is that code as it was;
 * every case checks the new figures against it on the same data, including
 * the awkward records old data holds (null or missing ids and types, string
 * sums, invoice lines without a sum).
 */

import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose, { Types } from 'mongoose'

import Payment from '@modules/models/Payment'
import { testConnectOptions } from '@utils/setupTestEnvironment'
import { getPayments, PaymentQueryParams } from './payment.service'

jest.mock('@utils/email/sendInvoiceEmail', () => ({
  sendInvoiceEmail: jest.fn(),
}))

jest.setTimeout(120000)

let mongo: MongoMemoryServer

beforeAll(async () => {
  mongo = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } })
  await mongoose.connect(mongo.getUri(), testConnectOptions)
  await Payment.createIndexes()
  await Payment.collection.insertMany(seed())
}, 120000)

afterAll(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})

const globalAdmin = {
  isGlobalAdmin: true,
  isDomainAdmin: false,
  isUser: false,
  user: { email: 'admin@test.com' },
}

const domainA = new Types.ObjectId()
const domainB = new Types.ObjectId()
const companyA = new Types.ObjectId()
const companyB = new Types.ObjectId()
const companyC = new Types.ObjectId()

function seed() {
  const base = (n: number, extra: Record<string, unknown>) => ({
    invoiceNumber: n,
    invoiceCreationDate: new Date(Date.UTC(2026, n % 6, 1 + n, 9)),
    ...extra,
  })
  return [
    base(1, {
      type: 'debit',
      domain: domainA,
      company: companyA,
      generalSum: 100.1,
      invoice: [
        { type: 'maintenance', sum: 60.05 },
        { type: 'electricity', price: 40.05 },
        { type: 'custom', name: 'Вода', sum: 10 },
        { name: 'no type', sum: 5 },
      ],
    }),
    base(2, {
      type: 'credit',
      domain: domainA,
      company: companyA,
      generalSum: 0.1,
      status: 'sent',
    }),
    base(3, {
      type: 'debit',
      domain: domainB,
      company: companyB,
      generalSum: 0.2,
      status: 'sent',
      invoice: [{ type: 'maintenance', sum: -3.3 }],
    }),
    // ids and types old records may lack
    base(4, { type: 'debit', domain: null, company: companyC, generalSum: 7 }),
    base(5, { type: 'credit', company: companyC, generalSum: 3 }),
    base(6, { type: 'debit', domain: domainB, company: null, generalSum: 1 }),
    base(7, { type: 'debit', domain: domainB, generalSum: 2, invoice: [] }),
    base(8, { type: null, domain: domainA, company: companyA, generalSum: 4 }),
    base(9, { domain: domainA, company: companyB, generalSum: 5 }),
    base(10, {
      type: 'debit',
      domain: domainA,
      company: companyB,
      generalSum: '12.5',
      invoice: [{ type: 'maintenance', sum: '8' }],
    }),
    base(11, { type: 'credit', domain: domainB, company: companyA }),
  ]
}

async function legacyStats(query: PaymentQueryParams) {
  // The filter getPayments builds, as its ordering pipeline receives it.
  const spy = jest.spyOn(Payment, 'aggregate')
  await getPayments({ ...query, limit: '1' }, globalAdmin)
  const filter = (spy.mock.calls[0][0][0] as { $match: object }).$match
  spy.mockRestore()

  const total = await Payment.countDocuments(filter)
  const [distinctDomainIds, distinctCompanyIds] = await Promise.all([
    Payment.distinct('domain', filter),
    Payment.distinct('company', filter),
  ])
  const totalPayments = await Payment.aggregate([
    { $match: filter },
    { $group: { _id: '$type', totalSum: { $sum: '$generalSum' } } },
  ])
  const totalGeneralSum = await Payment.aggregate([
    { $match: filter },
    { $group: { _id: 'generalSum', totalSum: { $sum: '$generalSum' } } },
  ])
  const serviceTotals = await Payment.aggregate([
    { $match: { ...filter, type: 'debit' } },
    { $unwind: '$invoice' },
    {
      $addFields: {
        invoiceSum: {
          $cond: {
            if: { $isNumber: '$invoice.sum' },
            then: { $toDouble: '$invoice.sum' },
            else: {
              $cond: {
                if: { $isNumber: '$invoice.price' },
                then: { $toDouble: '$invoice.price' },
                else: 0,
              },
            },
          },
        },
        invoiceKey: {
          $cond: {
            if: { $eq: ['$invoice.type', 'custom'] },
            then: { $concat: ['custom-name:', '$invoice.name'] },
            else: '$invoice.type',
          },
        },
      },
    },
    { $match: { invoiceKey: { $exists: true, $ne: null } } },
    { $group: { _id: '$invoiceKey', totalSum: { $sum: '$invoiceSum' } } },
  ])

  return {
    currentCompaniesCount: distinctCompanyIds.length,
    currentDomainsCount: distinctDomainIds.length,
    totalPayments: [
      ...totalPayments,
      ...totalGeneralSum,
      ...serviceTotals,
    ].reduce((acc, item) => {
      acc[item._id] = item.totalSum
      return acc
    }, {}),
    total,
  }
}

async function currentStats(query: PaymentQueryParams) {
  const { currentCompaniesCount, currentDomainsCount, totalPayments, total } =
    await getPayments({ ...query, limit: '10' }, globalAdmin)
  return { currentCompaniesCount, currentDomainsCount, totalPayments, total }
}

describe('getPayments - table figures match the separate reads they replace', () => {
  const cases: [string, PaymentQueryParams][] = [
    ['no filter', {}],
    ['type=debit', { type: 'debit' }],
    ['type=credit', { type: 'credit' }],
    ['one domain', { domainIds: domainA.toString() }],
    ['two companies', { companyIds: `${companyA},${companyB}` }],
    ['status=sent', { status: 'sent' }],
    ['status=draft + type=debit', { status: 'draft', type: 'debit' }],
    ['date range', { dateFrom: '2026-02-01', dateTo: '2026-05-31' }],
    ['month via $expr', { year: 2026, month: 3 }],
    ['nothing matches', { companyIds: new Types.ObjectId().toString() }],
  ]

  it.each(cases)('%s', async (_name, query) => {
    const expected = await legacyStats(query)
    expect(await currentStats(query)).toEqual(expected)
  })

  it('counts an explicit null id as a value and a missing one as none', async () => {
    // domains: A, B and #4's null; companies: A, B, C and #6's null
    expect(await currentStats({})).toMatchObject({
      currentDomainsCount: 3,
      currentCompaniesCount: 4,
      total: 11,
    })
    // credits #2 (A), #11 (B) and #5 with no domain at all
    expect(await currentStats({ type: 'credit' })).toMatchObject({
      currentDomainsCount: 2,
      total: 3,
    })
  })

  it('reports nothing matched as zeros and no sums', async () => {
    const stats = await currentStats({
      companyIds: new Types.ObjectId().toString(),
    })
    expect(stats).toEqual({
      currentCompaniesCount: 0,
      currentDomainsCount: 0,
      totalPayments: {},
      total: 0,
    })
  })

  it('counts service lines of debits even when the table shows credits', async () => {
    const { totalPayments } = await currentStats({ type: 'credit' })
    expect(totalPayments).toHaveProperty('maintenance')
    expect(totalPayments).not.toHaveProperty('debit')
  })
})
