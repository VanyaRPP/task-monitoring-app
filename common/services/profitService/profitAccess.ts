import { isValidObjectId } from 'mongoose'
import Domain from '@modules/models/Domain'
import RealEstate from '@modules/models/RealEstate'

/**
 * Who may read or write a Profit record - decided by the ledger it is filed
 * under, never by role alone (`isDomainAdmin` only means "admins SOME
 * domain"). Mirrors what the Прибутки page offers (useProfitScopes):
 *
 * - GlobalAdmin: everything.
 * - A domain record: an admin of THAT domain (`Domain.adminEmails`).
 * - A company record: an admin of THAT company (`RealEstate.adminEmails`).
 *   Being admin of the company's domain is not enough - the company ledger
 *   is the owner's own billing view (same rule as GET /profits/company).
 */

export interface ProfitTarget {
  domain?: unknown
  company?: unknown
}

export interface ProfitAccessUser {
  isGlobalAdmin: boolean
  user: { email: string }
}

const idOf = (value: unknown): string | null => {
  const id = value == null ? '' : String(value)
  return id && isValidObjectId(id) ? id : null
}

export async function canAccessProfitTarget(
  target: ProfitTarget,
  { isGlobalAdmin, user }: ProfitAccessUser
): Promise<boolean> {
  if (isGlobalAdmin) return true

  const company = idOf(target.company)
  if (company) {
    return !!(await RealEstate.exists({
      _id: company,
      adminEmails: user.email,
    }))
  }

  const domain = idOf(target.domain)
  if (domain) {
    return !!(await Domain.exists({ _id: domain, adminEmails: user.email }))
  }

  return false
}
