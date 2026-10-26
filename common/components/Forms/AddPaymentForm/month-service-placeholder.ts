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
  return dayjs(value.slice(MONTH_SERVICE_PLACEHOLDER_PREFIX.length)).startOf(
    'month'
  )
}
export type PreviewMonthService = {
  _id: string
  date: string | Date
}

/**
 * Builds monthService for the invoice preview (currPayment).
 * The preview needs { _id, date }, not just an id, because templates
 * read monthService.date to show the service month.
 */
export function buildPreviewMonthService({
  monthServiceId,
  service,
  placeholder,
}: {
  monthServiceId?: string
  service?: { date?: string | Date } | null
  placeholder?: string
}): PreviewMonthService | undefined {
  if (monthServiceId && service?.date) {
    return { _id: monthServiceId, date: service.date }
  }

  if (isMonthServicePlaceholder(placeholder)) {
    return {
      _id: monthServiceId ?? placeholder,
      date: parseMonthServicePlaceholder(placeholder).toISOString(),
    }
  }

  return undefined
}
