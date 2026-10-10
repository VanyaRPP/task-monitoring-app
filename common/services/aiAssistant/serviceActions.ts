import Domain from '@modules/models/Domain'
import Street from '@modules/models/Street'
import { getDomainServiceCatalog } from '@common/services/customServiceService/customService.service'
import { findMonthService } from '@common/services/aiAssistant/invoiceActions'
import type { UserContext } from '@common/services/paymentService/payment.service'
import { toRoundFixed } from '@utils/helpers'

/**
 * Builds the draft behind the `previewService` tool: a month's tariffs
 * ("Послуга") for AddServiceModal to open prefilled. Nothing is written.
 *
 * The user names tariffs in their own words ("електрика 4.32, вода 30"); they
 * are matched here to the domain's service catalog. Tariffs not mentioned are
 * carried over from the previous month, since most months change only one or
 * two. When the month already has a Service, it is opened for editing with the
 * new prices instead of drafting a second one.
 */

/** Tariffs stored as top-level Service fields, besides the catalog rows. */
const TOP_LEVEL_FIELDS = [
  'rentPrice',
  'electricityPrice',
  'waterPrice',
  'waterPriceTotal',
  'garbageCollectorPrice',
  'inflicionPrice',
] as const

// Word stems people use for the standard tariffs → their field names.
const ALIASES: [RegExp, string][] = [
  [/електр|світл|квт/, 'electricityPrice'],
  [/водовідв|каналіз/, 'waterPriceTotal'],
  [/вод/, 'waterPrice'],
  [/смітт|вивіз|тпв/, 'garbageCollectorPrice'],
  [/утрим|оренд|обслугов/, 'rentPrice'],
  [/інфляц/, 'inflicionPrice'],
  [/прибир/, 'cleaningPrice'],
  [/квартпл/, 'housingFeePrice'],
]

const normalize = (value: string) =>
  value.toLowerCase().replace(/[^a-zа-яіїєґ0-9]/g, '')

export interface ServicePriceInput {
  /** As the user said it: "електрика", "вода", "Вивіз сміття". */
  name: string
  price: number
}

export interface BuildServiceDraftParams {
  domainId: string
  /** Address in the user's words; omitted for a domain-wide service. */
  street?: string
  month: number
  year: number
  prices: ServicePriceInput[]
  description?: string
  ctx: UserContext
}

interface CatalogEntry {
  fieldName: string
  name: string
}

export interface ServiceDraftLine {
  fieldName: string
  name: string
  price: number
  /** Said by the user now, or carried over from last month. */
  source: 'user' | 'previous'
}

/** The catalog entry a tariff the user named refers to, if any. */
export function matchTariff(
  said: string,
  catalog: CatalogEntry[]
): CatalogEntry | null {
  const key = normalize(said)
  if (!key) return null

  const byField = catalog.find(({ fieldName }) => normalize(fieldName) === key)
  if (byField) return byField

  const byName = catalog.find(({ name }) => {
    const known = normalize(name)
    return (
      known.length >= 3 &&
      key.length >= 3 &&
      (known.includes(key) || key.includes(known))
    )
  })
  if (byName) return byName

  const alias = ALIASES.find(([stem]) => stem.test(said.toLowerCase()))?.[1]
  if (!alias) return null
  const aliased = catalog.find(({ fieldName }) => fieldName === alias)
  if (aliased) return aliased
  // A domain without a catalog still has the standard top-level tariffs.
  return catalog.length === 0 &&
    (TOP_LEVEL_FIELDS as readonly string[]).includes(alias)
    ? { fieldName: alias, name: said }
    : null
}

/** Prices a stored Service holds, by field name (top-level and rows). */
function pricesOf(service: any): Record<string, number> {
  if (!service) return {}
  const prices: Record<string, number> = {}
  for (const field of TOP_LEVEL_FIELDS) {
    if (typeof service[field] === 'number') prices[field] = service[field]
  }
  for (const row of service.customServices ?? []) {
    if (row?.fieldName && typeof row.price === 'number') {
      prices[row.fieldName] = row.price
    }
  }
  return prices
}

async function resolveStreet(domainId: string, said?: string) {
  if (!said?.trim()) return null

  const domain = await Domain.findById(domainId).select('streets').lean()
  const streets = await Street.find({ _id: { $in: domain?.streets ?? [] } })
    .select('address city')
    .lean()
  const key = normalize(said)
  const match = streets.find((street) => {
    const address = normalize(street.address)
    return address.includes(key) || key.includes(address)
  })
  if (!match) {
    const known = streets.map(({ address }) => address).join(', ')
    throw new Error(
      `street not found in this domain${known ? `; its addresses: ${known}` : ''}`
    )
  }
  return { _id: match._id.toString(), address: match.address }
}

export async function buildServiceDraft({
  domainId,
  street: saidStreet,
  month,
  year,
  prices,
  description,
  ctx,
}: BuildServiceDraftParams) {
  const domain = await Domain.findOne({
    _id: domainId,
    ...(ctx.isGlobalAdmin ? {} : { adminEmails: ctx.user.email }),
  })
    .select('name')
    .lean()
  if (!domain) throw new Error('domain not accessible')

  const street = await resolveStreet(domainId, saidStreet)
  const catalog: CatalogEntry[] = (
    (await getDomainServiceCatalog(domainId)) ?? []
  )
    .flatMap((group) => group.services)
    .map((service: any) => ({
      fieldName: String(service.fieldName ?? ''),
      name: String(service.name ?? service.fieldName ?? ''),
    }))
    .filter(({ fieldName }) => fieldName)

  // What the user named, matched to the catalog; the rest is reported back.
  const said: Record<string, number> = {}
  const unmatched: string[] = []
  for (const { name, price } of prices) {
    const entry = matchTariff(name, catalog)
    const value = Number(price)
    if (!entry || !Number.isFinite(value) || value < 0) {
      unmatched.push(name)
      continue
    }
    said[entry.fieldName] = Number(toRoundFixed(value))
  }

  const existing = await findMonthService(
    domainId,
    street?._id,
    year,
    month,
    ctx
  )
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const previous = existing
    ? null
    : await findMonthService(domainId, street?._id, prevYear, prevMonth, ctx)

  const base = existing ? pricesOf(existing) : pricesOf(previous)
  const merged = { ...base, ...said }

  const nameOf = (fieldName: string) =>
    catalog.find((entry) => entry.fieldName === fieldName)?.name ?? fieldName
  const lines: ServiceDraftLine[] = Object.entries(merged).map(
    ([fieldName, price]) => ({
      fieldName,
      name: nameOf(fieldName),
      price,
      source: fieldName in said ? 'user' : 'previous',
    })
  )

  const scope = {
    domain: { _id: domainId, name: domain.name },
    ...(street ? { street: { _id: street._id, address: street.address } } : {}),
  }

  if (existing) {
    // Opened for editing: its own rows with the new prices, plus rows for any
    // catalog tariff it did not have yet.
    const rows = (existing.customServices ?? []).map((row: any) => ({
      ...(row.toObject?.() ?? row),
      _id: row._id?.toString(),
      price: row.fieldName in said ? said[row.fieldName] : row.price,
    }))
    for (const fieldName of Object.keys(said)) {
      if (!rows.some((row) => row.fieldName === fieldName)) {
        rows.push({
          fieldName,
          label: nameOf(fieldName),
          price: said[fieldName],
        })
      }
    }
    const topLevel = Object.fromEntries(
      TOP_LEVEL_FIELDS.filter((field) => field in said).map((field) => [
        field,
        said[field],
      ])
    )

    return {
      mode: 'edit' as const,
      service: {
        ...existing.toObject(),
        _id: existing._id.toString(),
        ...scope,
        ...topLevel,
        ...(description?.trim() ? { description: description.trim() } : {}),
        customServices: rows,
      },
      lines,
      unmatched,
      domainName: domain.name,
      streetAddress: street?.address ?? null,
    }
  }

  return {
    mode: 'create' as const,
    // Prices keyed by field name at the top level: the form builds its rows
    // from the domain's catalog and reads each row's price by field name.
    service: {
      ...scope,
      date: new Date(Date.UTC(year, month - 1, 1, 12, 0, 0)).toISOString(),
      description: description?.trim() ?? '',
      customServices: [],
      ...merged,
    },
    lines,
    unmatched,
    domainName: domain.name,
    streetAddress: street?.address ?? null,
  }
}
