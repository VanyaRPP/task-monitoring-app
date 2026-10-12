import dayjs, { Dayjs } from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(customParseFormat)

/** Calendar-date format used in the store and the URL: `2026-08-01`. */
export const DATE_RANGE_FORMAT = 'YYYY-MM-DD'
export const DATE_FROM_QUERY_PARAM = 'dateFrom'
export const DATE_TO_QUERY_PARAM = 'dateTo'

/** Inclusive range of calendar days, both ends in `YYYY-MM-DD`. */
export interface PaymentDateRange {
  dateFrom: string
  dateTo: string
}

type RawParam = string | string[] | null | undefined

const parseDay = (raw: unknown): Dayjs | null => {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (typeof value !== 'string') return null
  const parsed = dayjs(value, DATE_RANGE_FORMAT, true)
  return parsed.isValid() ? parsed : null
}

/**
 * Normalises a range from the store or URL. Returns `null` unless both ends
 * are valid calendar dates; reversed ends are swapped.
 */
export function parseDateRange(
  dateFrom: RawParam | unknown,
  dateTo: RawParam | unknown
): PaymentDateRange | null {
  const from = parseDay(dateFrom)
  const to = parseDay(dateTo)
  if (!from || !to) return null

  const [start, end] = to.isBefore(from) ? [to, from] : [from, to]
  return {
    dateFrom: start.format(DATE_RANGE_FORMAT),
    dateTo: end.format(DATE_RANGE_FORMAT),
  }
}

/**
 * Picker values are local-time dayjs objects. Formatting them (instead of
 * `toISOString()`) keeps the day the user clicked, whatever the timezone.
 */
export function dateRangeFromPicker(
  dates: [Dayjs | null, Dayjs | null] | null | undefined
): PaymentDateRange | null {
  if (!dates?.[0] || !dates?.[1]) return null
  return parseDateRange(
    dates[0].format(DATE_RANGE_FORMAT),
    dates[1].format(DATE_RANGE_FORMAT)
  )
}

export function dateRangeToPickerValue(
  range?: Partial<PaymentDateRange> | null
): [Dayjs, Dayjs] | null {
  const parsed = parseDateRange(range?.dateFrom, range?.dateTo)
  if (!parsed) return null
  return [
    dayjs(parsed.dateFrom, DATE_RANGE_FORMAT, true),
    dayjs(parsed.dateTo, DATE_RANGE_FORMAT, true),
  ]
}

/**
 * Converts calendar days into instants for the API: start of the first day and
 * end of the last day in the viewer's timezone — the same timezone the table
 * renders `invoiceCreationDate` in, so the filter matches what is on screen.
 */
export function dateRangeToQueryBounds(
  range?: Partial<PaymentDateRange> | null
): { dateFrom?: string; dateTo?: string } {
  const parsed = parseDateRange(range?.dateFrom, range?.dateTo)
  if (!parsed) return {}
  return {
    dateFrom: dayjs(parsed.dateFrom, DATE_RANGE_FORMAT, true)
      .startOf('day')
      .toISOString(),
    dateTo: dayjs(parsed.dateTo, DATE_RANGE_FORMAT, true)
      .endOf('day')
      .toISOString(),
  }
}

/** Returns `filters` with the range set, or with the range keys removed. */
export function applyDateRangeToFilters<T extends Record<string, any>>(
  filters: T | undefined,
  range: PaymentDateRange | null
): T & Partial<PaymentDateRange> {
  const { dateFrom, dateTo, ...rest } = (filters ?? {}) as T &
    Partial<PaymentDateRange>
  return (range ? { ...rest, ...range } : rest) as T & Partial<PaymentDateRange>
}
