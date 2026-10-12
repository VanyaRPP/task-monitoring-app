import type {
  IDomainIndexMonth,
  IInflationIndex,
} from '@common/api/inflationIndexApi/inflationIndex.api.types'
import DomainInflationOverride, {
  IDomainInflationOverride,
} from '@modules/models/DomainInflationOverride'
import DomainInflationOverrideLog from '@modules/models/DomainInflationOverrideLog'
import InflationIndex from '@modules/models/InflationIndex'
import {
  buildMonthRange,
  formatPeriod,
  IYearMonth,
} from '@utils/debt-calculation/months'
import { writeServicesIndex } from './fill-services'
import { INDEX_RANGE } from './reconcile'

type IOverrideLike = Pick<IDomainInflationOverride, 'year' | 'month' | 'value'>

export const mergeDomainIndexes = (
  reference: Record<string, number>,
  overrides: IOverrideLike[]
): Record<string, number> => {
  const merged = { ...reference }
  for (const { year, month, value } of overrides) {
    merged[formatPeriod({ year, month })] = value
  }
  return merged
}

export const applyDomainOverrides = (
  reference: IInflationIndex[],
  overrides: IOverrideLike[]
): IInflationIndex[] => {
  const byPeriod = new Map(
    reference.map((item) => [formatPeriod(item), { ...item }])
  )

  for (const { year, month, value } of overrides) {
    const period = formatPeriod({ year, month })
    byPeriod.set(period, {
      ...(byPeriod.get(period) ?? { year, month }),
      value,
      domainOverride: true,
    })
  }

  return [...byPeriod.values()].sort(
    (a, b) => a.year * 12 + a.month - (b.year * 12 + b.month)
  )
}

export async function getDomainIndexMonths(
  domainId: string,
  from: IYearMonth,
  to: IYearMonth
): Promise<IDomainIndexMonth[]> {
  const months = buildMonthRange(from, to)
  const years = { $gte: from.year, $lte: to.year }

  const [reference, overrides] = await Promise.all([
    InflationIndex.find({ year: years }).lean(),
    DomainInflationOverride.find({ domain: domainId, year: years }).lean(),
  ])

  const referenceBy = new Map(
    reference.map((item) => [formatPeriod(item), item])
  )
  const overrideBy = new Map(
    overrides.map((item) => [formatPeriod(item), item])
  )

  return months.map((yearMonth) => {
    const period = formatPeriod(yearMonth)
    const ref = referenceBy.get(period)
    const own = overrideBy.get(period)

    return {
      ...yearMonth,
      reference: ref?.value ?? null,
      override: own
        ? {
            value: own.value,
            updatedBy: own.updatedBy,
            updatedAt: own.updatedAt?.toISOString(),
          }
        : null,
      value: own?.value ?? ref?.value ?? null,
    }
  })
}

export const isValidIndexValue = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isFinite(value) &&
  value >= INDEX_RANGE.min &&
  value <= INDEX_RANGE.max

export interface IOverrideActor {
  email?: string
  id?: string
}

export async function setDomainOverride(
  domainId: string,
  { year, month }: IYearMonth,
  value: number,
  actor: IOverrideActor
): Promise<void> {
  const previous = await DomainInflationOverride.findOne({
    domain: domainId,
    year,
    month,
  }).lean()
  const now = new Date()

  await DomainInflationOverride.updateOne(
    { domain: domainId, year, month },
    { $set: { value, updatedBy: actor.email, updatedAt: now } },
    { upsert: true }
  )

  await DomainInflationOverrideLog.create({
    domain: domainId,
    year,
    month,
    action: 'set',
    before: previous?.value ?? null,
    after: value,
    actorEmail: actor.email,
    actorId: actor.id,
    date: now,
  })

  await writeServicesIndex(domainId, year, month, value)
}

export async function resetDomainOverride(
  domainId: string,
  { year, month }: IYearMonth,
  actor: IOverrideActor
): Promise<boolean> {
  const previous = await DomainInflationOverride.findOneAndDelete({
    domain: domainId,
    year,
    month,
  }).lean()
  if (!previous) return false

  await DomainInflationOverrideLog.create({
    domain: domainId,
    year,
    month,
    action: 'reset',
    before: previous.value,
    after: null,
    actorEmail: actor.email,
    actorId: actor.id,
    date: new Date(),
  })

  const reference = await InflationIndex.findOne({ year, month }).lean()
  await writeServicesIndex(domainId, year, month, reference?.value ?? 0)

  return true
}
