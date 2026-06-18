import { IPaymentField } from '@common/api/paymentApi/payment.api.types'

/**
 * Invoice "types" that are always kept (and shown), even when their sum is 0 —
 * the core utility services that are seeded by default.
 */
export const DEFAULT_INVOICE_TYPES = [
  'discount',
  'maintenancePrice',
  'garbageCollectorPrice',
  'electricityPrice',
]

/**
 * Decide whether an invoice row should be kept for rendering ("Довідка") and
 * for seeding a freshly created payment.
 *
 * A row is kept when it carries a real value — a NON-ZERO sum, whether positive
 * OR negative (e.g. an ad-hoc custom "Знижка" with `sum < 0`) — or when it is
 * one of the always-visible default service types. Rows whose sum is 0, empty
 * or non-numeric are dropped (unless they are a default type).
 *
 * Historically this used `sum > 0`, which silently swallowed negative custom
 * rows. The rest of the payment pipeline already keeps them (`+sum !== 0`), so
 * this predicate brings the certificate / seed paths in line.
 */
export const keepInvoiceRow = (
  invoice?: Partial<IPaymentField> | null
): boolean => {
  const sum = Number(invoice?.sum)
  const hasNonZeroValue = sum > 0 || sum < 0 // NaN and 0 → false
  return (
    hasNonZeroValue || DEFAULT_INVOICE_TYPES.includes(invoice?.type as string)
  )
}
