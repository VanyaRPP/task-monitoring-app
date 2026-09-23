export interface IYearMonth {
  year: number
  /** Month number, 1-12 (NOT the zero-based `Date#getMonth`). */
  month: number
}

export const isLeapYear = (year: number): boolean =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0

/**
 * Divisor for the annual-interest formula. The Act prorates every month by the
 * calendar of ITS OWN year, so leap 2024 divides by 366 and its neighbours by
 * 365.
 */
export const daysInYear = (year: number): number =>
  isLeapYear(year) ? 366 : 365

/** Calendar days in the month (`month` is 1-12). */
export const daysInMonth = (year: number, month: number): number =>
  new Date(year, month, 0).getDate()

const isValidMonth = (value?: IYearMonth): boolean =>
  !!value &&
  Number.isInteger(value.year) &&
  Number.isInteger(value.month) &&
  value.month >= 1 &&
  value.month <= 12

/**
 * Every month from `from` to `to`, both inclusive.
 *
 * Empty when a bound is missing, malformed, or `to` precedes `from`, so a
 * half-filled period form degrades instead of breaking the calculation.
 */
export const buildMonthRange = (
  from?: IYearMonth,
  to?: IYearMonth
): IYearMonth[] => {
  if (!isValidMonth(from) || !isValidMonth(to)) return []

  const months: IYearMonth[] = []
  let { year, month } = from

  while (year < to.year || (year === to.year && month <= to.month)) {
    months.push({ year, month })
    month += 1
    if (month > 12) {
      month = 1
      year += 1
    }
  }

  return months
}

/**
 * Absolute month ordinal, so periods can be compared and sorted without
 * juggling (year, month) pairs.
 */
export const periodKey = ({ year, month }: IYearMonth): number =>
  year * 12 + month

/** Whether `value` falls inside [`from`, `to`], both inclusive. */
export const isWithinPeriod = (
  value: IYearMonth,
  from?: IYearMonth,
  to?: IYearMonth
): boolean => {
  const key = periodKey(value)

  if (from && key < periodKey(from)) return false
  if (to && key > periodKey(to)) return false

  return true
}

/** Parses `YYYY-MM` (an API query param). `null` for anything else. */
export const parsePeriod = (value?: string): IYearMonth | null => {
  const match = /^(\d{4})-(\d{1,2})$/.exec(String(value ?? '').trim())
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])

  return month >= 1 && month <= 12 ? { year, month } : null
}

/** Formats as `YYYY-MM` - the inverse of {@link parsePeriod}. */
export const formatPeriod = ({ year, month }: IYearMonth): string =>
  `${year}-${String(month).padStart(2, '0')}`
