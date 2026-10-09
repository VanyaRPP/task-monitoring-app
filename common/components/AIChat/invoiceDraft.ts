import dayjs from 'dayjs'
import { buildMonthServicePlaceholder } from '@common/components/Forms/AddPaymentForm/month-service-placeholder'

export interface IInvoiceDraftPeriod {
  year: number
  month: number
}

interface IInvoiceDraftLike {
  monthService: string | null
  period?: IInvoiceDraftPeriod
  /** Passed to the modal on its own (`extraInvoiceLines`), not as a field. */
  extraLines?: unknown[]
}

/**
 * The `previewInvoice` draft as `AddPaymentModal` takes it. A month with no
 * Service yet comes without `monthService`; it becomes the same placeholder
 * `MonthServiceSelect` offers for that month, so the form shows the billed
 * month and creates its Service only on save. Built here, in the browser,
 * because the placeholder is the month start in the viewer's timezone.
 */
export function toPaymentFormData<T extends IInvoiceDraftLike>(
  draft: T
): Omit<T, 'period' | 'extraLines'> & { monthService: string | null } {
  const { period, extraLines: _extraLines, ...payment } = draft
  if (payment.monthService || !period) return payment

  return {
    ...payment,
    monthService: buildMonthServicePlaceholder(
      dayjs(new Date(period.year, period.month - 1, 1))
    ),
  }
}
