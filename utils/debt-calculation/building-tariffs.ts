import { dayNumber } from './exclusions'
import {
  buildMonthRange,
  daysInMonth,
  formatPeriod,
  IYearMonth,
} from './months'

/**
 * The tariffs of one building over the years, as the management company
 * prints them: periods down the side, a tariff per group of apartments
 * («І поверх» - №№ 1-4; 37-40, «вище І поверху» - the rest) across.
 *
 * Kept with the provider (the domain), one per address. A company takes the
 * column of its apartment; its own tariff, typed on the page, still wins.
 */

export interface ITariffGroup {
  /** As printed: «І поверх», «вище І поверху». */
  label: string
  /** The apartments, as printed: «1-4; 37-40»; empty for «решта квартир». */
  apartments: string
}

export interface ITariffPeriod {
  /** `YYYY-MM-DD`: the first day the tariffs hold. */
  from: string
  /**
   * `YYYY-MM-DD` as printed, none for «по даний час». Only the last period's
   * end is read: any other ends the day before the next one begins, so a
   * document that has two periods share a day stays unambiguous.
   */
  to?: string
  /** One per group, in the groups' order; `null` where none is given. */
  tariffs: (number | null)[]
}

export interface IBuildingTariffs {
  /** The street's `_id`; none for the companies without an address. */
  street?: string
  /** The address as the document names it. */
  address?: string
  groups: ITariffGroup[]
  periods: ITariffPeriod[]
  /** ISO stamp of the last save. */
  updatedAt?: string
}

/** A stretch of one tariff within a month, days inclusive. */
export interface ITariffPart {
  fromDay: number
  toDay: number
  value: number
}

export interface ITariffMonth {
  /**
   * The tariff for the whole month: when it changed mid-month, the average
   * weighted by days, so area × it is the charge of both parts together.
   */
  value: number
  /** Set only when the tariff changed within the month. */
  parts?: ITariffPart[]
}

const RANGE = /(\d+)\s*[-–—]\s*(\d+)|(\d+)/g

/** «№№ 1-4; 37-40; 5» → `[[1, 4], [37, 40], [5, 5]]`; text alone → none. */
export const apartmentRanges = (text: string): [number, number][] =>
  [...(text ?? '').matchAll(RANGE)].map(([, from, to, single]) =>
    single
      ? [Number(single), Number(single)]
      : [Math.min(Number(from), Number(to)), Math.max(Number(from), Number(to))]
  )

// No `\b`: in JS it does not see Cyrillic letters as word characters.
const APARTMENT = /(?:№|кв\.?|квартира)\s*0*(\d+)(?!\d)/i

/** The apartment number in a company's name or description, if there is one. */
export const apartmentOf = (
  ...texts: (string | undefined | null)[]
): number | undefined => {
  for (const text of texts) {
    const match = APARTMENT.exec(text ?? '')
    if (match) return Number(match[1])
  }
  return undefined
}

/**
 * The group a company pays by: the one picked for it on the page, else the
 * one whose apartments hold its number, else the group of «the rest». A lone
 * group is everyone's. Undefined when it cannot be told.
 */
export const groupOfApartment = (
  tariffs: Pick<IBuildingTariffs, 'groups'> | undefined,
  apartment: number | undefined,
  chosen?: number
): number | undefined => {
  const groups = tariffs?.groups ?? []
  if (groups.length === 0) return undefined
  if (Number.isInteger(chosen) && chosen >= 0 && chosen < groups.length) {
    return chosen
  }
  if (groups.length === 1) return 0

  const ranges = groups.map(({ apartments }) => apartmentRanges(apartments))
  if (apartment !== undefined) {
    const listed = ranges.findIndex((list) =>
      list.some(([from, to]) => apartment >= from && apartment <= to)
    )
    if (listed >= 0) return listed
  }
  const rest = ranges.findIndex((list) => list.length === 0)
  return apartment !== undefined && rest >= 0 ? rest : undefined
}

interface ISpan {
  start: number
  end: number
  value: number
}

/** Each period from its first day to the day before the next one. */
const spansOf = (tariffs: IBuildingTariffs, group: number): ISpan[] => {
  const periods = tariffs.periods
    .map((period) => ({ period, start: dayNumber(period.from) }))
    .filter(
      (entry): entry is { period: ITariffPeriod; start: number } =>
        entry.start !== null
    )
    .sort((a, b) => a.start - b.start)

  return periods.flatMap(({ period, start }, index) => {
    const value = period.tariffs[group]
    const next = periods[index + 1]
    const end = next
      ? next.start - 1
      : (dayNumber(period.to ?? '') ?? Number.POSITIVE_INFINITY)
    return value === null || value === undefined || end < start
      ? []
      : [{ start, end, value }]
  })
}

/**
 * The tariff of one month for a group. A month the tariff changed in gets
 * both parts by their days; days of the month no period covers (before the
 * first one, after the last) take the nearest part.
 */
export const tariffInMonth = (
  tariffs: IBuildingTariffs | undefined,
  group: number | undefined,
  { year, month }: IYearMonth
): ITariffMonth | undefined => {
  if (!tariffs || group === undefined) return undefined

  const days = daysInMonth(year, month)
  const first = Date.UTC(year, month - 1, 1) / 86_400_000
  const last = first + days - 1

  const parts = spansOf(tariffs, group)
    .filter(({ start, end }) => start <= last && end >= first)
    .map(({ start, end, value }) => ({
      fromDay: Math.max(start, first) - first + 1,
      toDay: Math.min(end, last) - first + 1,
      value,
    }))
    // Two periods with one tariff are one part.
    .reduce<ITariffPart[]>((merged, part) => {
      const previous = merged[merged.length - 1]
      if (previous && previous.value === part.value) {
        previous.toDay = part.toDay
      } else {
        merged.push({ ...part })
      }
      return merged
    }, [])

  if (parts.length === 0) return undefined
  if (parts.length === 1) return { value: parts[0].value }

  parts[0].fromDay = 1
  parts[parts.length - 1].toDay = days
  const weighted = parts.reduce(
    (sum, { fromDay, toDay, value }) => sum + value * (toDay - fromDay + 1),
    0
  )
  // Not rounded: area × it must come to the two parts' charges to the kopeck.
  return { value: weighted / days, parts }
}

/** The tariff of every month of a period that has one, by `YYYY-MM`. */
export const tariffsByMonth = (
  tariffs: IBuildingTariffs | undefined,
  group: number | undefined,
  from?: IYearMonth,
  to?: IYearMonth
): Record<string, ITariffMonth> => {
  const out: Record<string, ITariffMonth> = {}
  if (!tariffs || group === undefined) return out
  for (const yearMonth of buildMonthRange(from, to)) {
    const tariff = tariffInMonth(tariffs, group, yearMonth)
    if (tariff) out[formatPeriod(yearMonth)] = tariff
  }
  return out
}

/** The building's tariffs that apply to a company on a street (or none). */
export const tariffsOfStreet = (
  list: IBuildingTariffs[] | undefined,
  street: string | undefined
): IBuildingTariffs | undefined =>
  (list ?? []).find((entry) => (entry.street ?? undefined) === street)

const DAY_LABEL = (iso: string): string => {
  const [year, month, day] = iso.split('-')
  return `${day}.${month}.${year}`
}

/** What a reader should check: holes between periods, tariffs left blank. */
export const tariffWarnings = (tariffs: IBuildingTariffs): string[] => {
  const warnings: string[] = []
  const periods = [...tariffs.periods].sort((a, b) =>
    a.from.localeCompare(b.from)
  )
  periods.forEach((period, index) => {
    const next = periods[index + 1]
    const end = dayNumber(period.to ?? '')
    const nextStart = next ? dayNumber(next.from) : null
    if (end !== null && nextStart !== null && nextStart > end + 1) {
      warnings.push(
        `Між ${DAY_LABEL(period.to)} і ${DAY_LABEL(next.from)} немає тарифу: ці дні рахуються за попереднім.`
      )
    }
    tariffs.groups.forEach((group, at) => {
      const value = period.tariffs[at]
      if (value === null || value === undefined) {
        warnings.push(
          `Період з ${DAY_LABEL(period.from)}: немає тарифу для «${group.label || `групи ${at + 1}`}».`
        )
      }
    })
  })
  return warnings
}

const MAX_GROUPS = 20
const MAX_PERIODS = 200
const MAX_TEXT = 300
const OBJECT_ID = /^[0-9a-fA-F]{24}$/

const text = (value: unknown, max = MAX_TEXT): string =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

const tariff = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  return Number.isFinite(num) && num >= 0 ? Math.round(num * 1e4) / 1e4 : null
}

/**
 * A building's tariffs as they may be stored: known fields, real dates, a
 * tariff per group. It also reads what is stored - the domain document is
 * written by other forms too, so nothing there is taken on trust.
 */
export const sanitizeBuildingTariffs = (
  source: unknown
): IBuildingTariffs | undefined => {
  if (!source || typeof source !== 'object') return undefined
  const raw = source as Record<string, unknown>

  const groups: ITariffGroup[] = (Array.isArray(raw.groups) ? raw.groups : [])
    .slice(0, MAX_GROUPS)
    .map((group) => ({
      label: text((group as ITariffGroup)?.label),
      apartments: text((group as ITariffGroup)?.apartments),
    }))
  if (groups.length === 0) return undefined

  const periods: ITariffPeriod[] = (
    Array.isArray(raw.periods) ? raw.periods : []
  )
    .slice(0, MAX_PERIODS)
    .flatMap((period) => {
      const { from, to, tariffs } = (period ?? {}) as Record<string, unknown>
      if (typeof from !== 'string' || dayNumber(from) === null) return []
      const end =
        typeof to === 'string' && dayNumber(to) !== null ? to : undefined
      const values = Array.isArray(tariffs) ? tariffs : []
      return [
        {
          from,
          ...(end ? { to: end } : {}),
          tariffs: groups.map((_, at) => tariff(values[at])),
        },
      ]
    })
    .sort((a, b) => a.from.localeCompare(b.from))

  const street = typeof raw.street === 'string' ? raw.street : ''
  const address = text(raw.address)
  const updatedAt =
    typeof raw.updatedAt === 'string' &&
    Number.isFinite(Date.parse(raw.updatedAt))
      ? new Date(raw.updatedAt).toISOString()
      : undefined

  return {
    ...(OBJECT_ID.test(street) ? { street } : {}),
    ...(address ? { address } : {}),
    groups,
    periods,
    ...(updatedAt ? { updatedAt } : {}),
  }
}
