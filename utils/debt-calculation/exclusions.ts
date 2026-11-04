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

/**
 * A month's index is applied when at least this many of its days are not
 * excluded. By analogy with the rule for when a debt arises or is paid within
 * a month (letter of the Supreme Court 62-97р): a moratorium starting after the
 * 15th leaves the month indexed, one ending after the 15th does not. Pending
 * legal confirmation - the one place to change it.
 */
export const MIN_INDEXED_DAYS = 16

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
  /** Days inside an excluded period, from `fromDay` to the end of the month. */
  excludedDays: number
  /** Whether the month's inflation index counts (see {@link MIN_INDEXED_DAYS}). */
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
 * How much of a month the excluded ranges take. `fromDay` is the day the
 * month's accrual starts on (the first month of a period may start mid-month):
 * only excluded days from it on are counted. Whether the month's index applies
 * always looks at the whole month - the index belongs to the month.
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
  const inMonth = (from: number) =>
    ranges.reduce(
      (sum, { start, end }) =>
        sum + Math.max(0, Math.min(end, last) - Math.max(start, from) + 1),
      0
    )

  return {
    excludedDays: inMonth(first + Math.max(fromDay, 1) - 1),
    indexApplies: days - inMonth(first) >= MIN_INDEXED_DAYS,
  }
}
