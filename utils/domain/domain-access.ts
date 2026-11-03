import Domain from '@modules/models/Domain'
import RealEstate from '@modules/models/RealEstate'
import mongoose from 'mongoose'

export interface IDomainAccessUser {
  isGlobalAdmin?: boolean
  isDomainAdmin?: boolean
  user?: { email?: string | null } | null
}

const isDomainId = (domainId: unknown): domainId is string =>
  typeof domainId === 'string' && mongoose.isValidObjectId(domainId)

export async function canEditDomain(
  { isGlobalAdmin, isDomainAdmin, user }: IDomainAccessUser,
  domainId: unknown
): Promise<boolean> {
  if (!isDomainId(domainId)) return false

  if (isGlobalAdmin) return !!(await Domain.exists({ _id: domainId }))

  if (isDomainAdmin && user?.email) {
    return !!(await Domain.exists({ _id: domainId, adminEmails: user.email }))
  }

  return false
}

export async function canViewDomain(
  access: IDomainAccessUser,
  domainId: unknown
): Promise<boolean> {
  if (!isDomainId(domainId)) return false
  if (await canEditDomain(access, domainId)) return true

  const email = access.user?.email
  if (!email) return false

  return !!(await RealEstate.exists({ domain: domainId, adminEmails: email }))
}
