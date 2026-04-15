import dayjs, { type Dayjs } from 'dayjs'

/** Prefix for Select values when no Service row exists yet for that month */
export const MONTH_SERVICE_PLACEHOLDER_PREFIX = '__month__:' as const

export function isMonthServicePlaceholder(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.startsWith(MONTH_SERVICE_PLACEHOLDER_PREFIX)
  )
}

export function buildMonthServicePlaceholder(month: Dayjs): string {
  return `${MONTH_SERVICE_PLACEHOLDER_PREFIX}${month
    .startOf('month')
    .toISOString()}`
}

export function parseMonthServicePlaceholder(value: string): Dayjs {
  return dayjs(
    value.slice(MONTH_SERVICE_PLACEHOLDER_PREFIX.length)
  ).startOf('month')
}
