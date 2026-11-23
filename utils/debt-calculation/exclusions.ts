import { daysInMonth } from './months'

/**
 * Periods during which neither inflation losses nor annual interest accrue -
 * a moratorium (КМУ №206) or any span the user sets. They are parameters of
 * one calculation, not stored anywhere; the debt itself is not affected.
 *
 * What a preset is called and which dates it stands for lives apart, in
 * `excludedPeriodPresets.ts`: the calculation only sees dates.
 */

export type ExcludedPeriodType = 'cmu_206' | 'custom'

export interface IExcludedPeriod {
  id: string
  type: ExcludedPeriodType
  /** `YYYY-MM-DD`, inclusive. */
  startDate: string
  /** `YYYY-MM-DD`, inclusive. */
  endDate: string
}

const DAY = 86_400_000
const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/

/** Days since the epoch, or null for anything that is not a real date. */
export const dayNumber = (value: string): number | null => {
  const match = ISO_DAY.exec(value ?? '')
  if (!match) return null
  const [year, month, day] = match.slice(1).map(Number)
  const time = Date.UTC(year, month - 1, day)
  const date = new Date(time)
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    ? time / DAY
    : null
}

interface IRange {
  start: number
  end: number
}

/**
 * The excluded days as disjoint ranges: overlapping or adjacent periods count
 * once. A period with an unreadable or reversed date is ignored.
 */
export const excludedRanges = (periods: IExcludedPeriod[] = []): IRange[] => {
  const ranges = periods
    .map(({ startDate, endDate }) => ({
      start: dayNumber(startDate),
      end: dayNumber(endDate),
    }))
    .filter(
      (range): range is IRange =>
        range.start !== null && range.end !== null && range.start <= range.end
    )
    .sort((a, b) => a.start - b.start)

  const merged: IRange[] = []
  for (const range of ranges) {
    const last = merged[merged.length - 1]
    if (last && range.start <= last.end + 1) {
      last.end = Math.max(last.end, range.end)
    } else {
      merged.push({ ...range })
    }
  }
  return merged
}

export interface IMonthExclusion {
  /**
   * Whether an excluded period takes any day of the month. Such a month is
   * excluded whole: no interest, no index - a court reads the table by months,
   * and a month half in, half out of a moratorium is the hardest to explain.
   */
  excluded: boolean
  /** The month's accruing days, from `fromDay` on, when it is excluded. */
  excludedDays: number
  /** Whether the month's inflation index counts. */
  indexApplies: boolean
}

const isoOf = (day: number): string =>
  new Date(day * DAY).toISOString().slice(0, 10)

/**
 * The periods as they apply to a calculation from `firstDay` to `lastDay`
 * (`YYYY-MM-DD`): each cut to that span, those wholly outside or unreadable
 * dropped. For showing and printing what was excluded.
 */
export const periodsWithin = (
  periods: IExcludedPeriod[],
  firstDay: string,
  lastDay: string
): IExcludedPeriod[] => {
  const from = dayNumber(firstDay)
  const to = dayNumber(lastDay)
  if (from === null || to === null) return []
  return periods.flatMap((period) => {
    const start = dayNumber(period.startDate)
    const end = dayNumber(period.endDate)
    if (start === null || end === null || start > end) return []
    const clippedStart = Math.max(start, from)
    const clippedEnd = Math.min(end, to)
    return clippedStart <= clippedEnd
      ? [
          {
            ...period,
            startDate: isoOf(clippedStart),
            endDate: isoOf(clippedEnd),
          },
        ]
      : []
  })
}

/** The periods that take any day of a month, as given (for showing them). */
export const periodsInMonth = (
  periods: IExcludedPeriod[],
  year: number,
  month: number
): IExcludedPeriod[] => {
  const first = Date.UTC(year, month - 1, 1) / DAY
  const last = first + daysInMonth(year, month) - 1
  return periods.filter(({ startDate, endDate }) => {
    const start = dayNumber(startDate)
    const end = dayNumber(endDate)
    return start !== null && end !== null && start <= last && end >= first
  })
}

/**
 * Whether the excluded ranges touch a month, which takes it out whole.
 * `fromDay` is the day the month's accrual starts on (the first month of a
 * period may start mid-month): the excluded days are counted from it.
 */
export const monthExclusion = (
  ranges: IRange[],
  year: number,
  month: number,
  fromDay = 1
): IMonthExclusion => {
  const days = daysInMonth(year, month)
  const first = Date.UTC(year, month - 1, 1) / DAY
  const last = first + days - 1
  const excluded = ranges.some(
    ({ start, end }) => start <= last && end >= first
  )
  const startDay = Math.min(Math.max(fromDay, 1), days)

  return {
    excluded,
    excludedDays: excluded ? days - startDay + 1 : 0,
    indexApplies: !excluded,
  }
}
