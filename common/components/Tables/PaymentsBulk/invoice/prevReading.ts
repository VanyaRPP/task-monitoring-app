import { ServiceType } from '@utils/constants'

interface PrevField {
  type?: string
  serviceId?: unknown
  fieldName?: string
  amount?: unknown
}

interface PrevPaymentLike {
  invoice?: PrevField[] | null
}

/**
 * The previous period's meter reading for a per-domain custom service, used to
 * seed this period's "Стара" (exactly like the native electricity/water column).
 *
 * Matches primarily by the stable `serviceId` (the service _id) — two services
 * whose names differ only in parentheses share a `fieldName`, so fieldName can't
 * tell them apart. Falls back to `fieldName` only for legacy rows saved before
 * `serviceId` was persisted. Returns 0 when there is no usable previous reading.
 */
export function resolvePrevReading(
  prevPayment: PrevPaymentLike | undefined | null,
  service: { serviceId: string; fieldName?: string }
): number {
  const fields = prevPayment?.invoice ?? []

  const byId = fields.find(
    (f) =>
      !!service.serviceId && String(f?.serviceId ?? '') === service.serviceId
  )

  // fieldName only speaks for legacy rows saved before `serviceId` was persisted
  // — a row that carries its own serviceId already answered above or belongs to
  // a different meter that happens to share this fieldName.
  const match =
    byId ??
    (service.fieldName
      ? fields.find(
          (f) =>
            !f?.serviceId &&
            f?.type === ServiceType.Custom &&
            f?.fieldName === service.fieldName
        )
      : undefined)

  return (
    +(Number((match as { amount?: unknown } | undefined)?.amount) || 0) || 0
  )
}
