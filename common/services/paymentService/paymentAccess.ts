import { isValidObjectId } from 'mongoose'
import Domain from '@modules/models/Domain'
import RealEstate from '@modules/models/RealEstate'

/**
 * Who may read or change a payment - decided by the payment's own domain and
 * company, never by role alone (`isDomainAdmin` only means "admins SOME
 * domain"). Mirrors the long-standing rule of GET /spacehub/payment/[id]:
 *
 * - read: GlobalAdmin; an admin of the payment's domain; an admin of its
 *   company (the company owner sees their own invoices).
 * - write: GlobalAdmin; an admin of the payment's domain.
 */

export interface PaymentAccessUser {
  isGlobalAdmin: boolean
  user: { email: string }
}

export interface PaymentScope {
  domain?: unknown
  company?: unknown
}

const idOf = (value: unknown): string | null => {
  const raw =
    value && typeof value === 'object' && '_id' in value
      ? (value as { _id: unknown })._id
      : value
  const id = raw == null ? '' : String(raw)
  return id && isValidObjectId(id) ? id : null
}

const administersDomain = async (domain: unknown, email: string) => {
  const id = idOf(domain)
  return !!id && !!(await Domain.exists({ _id: id, adminEmails: email }))
}

export async function canWritePayment(
  payment: PaymentScope,
  { isGlobalAdmin, user }: PaymentAccessUser
): Promise<boolean> {
  if (isGlobalAdmin) return true
  return administersDomain(payment.domain, user.email)
}

export async function canReadPayment(
  payment: PaymentScope,
  access: PaymentAccessUser
): Promise<boolean> {
  if (await canWritePayment(payment, access)) return true
  const company = idOf(payment.company)
  return (
    !!company &&
    !!(await RealEstate.exists({
      _id: company,
      adminEmails: access.user.email,
    }))
  )
}

/**
 * A new payment's target: the caller must administer its domain, and the
 * company must belong to that domain - otherwise a domain admin could bill
 * (and pull the details of) another domain's company under their own.
 */
export async function canCreatePaymentFor(
  target: PaymentScope,
  access: PaymentAccessUser
): Promise<boolean> {
  if (access.isGlobalAdmin) return true
  if (!(await canWritePayment(target, access))) return false

  const company = idOf(target.company)
  if (!company) return true
  return !!(await RealEstate.exists({
    _id: company,
    domain: idOf(target.domain),
  }))
}
