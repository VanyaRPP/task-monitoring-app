import Domain from '@modules/models/Domain'
import type { IRealEstateModel } from '@modules/models/RealEstate'
import type { IDomainAccessUser } from '@utils/domain/domain-access'
import mongoose, { type QueryFilter } from 'mongoose'

/**
 * Normalises the `domainIds` query param (array, comma-separated string, or
 * garbage) to the valid ObjectId strings it contains.
 */
export function parseDomainIds(raw: unknown): string[] {
  const parts = Array.isArray(raw)
    ? raw
    : typeof raw === 'string'
      ? raw.split(',')
      : []

  return parts
    .map((id) => (typeof id === 'string' ? id.trim() : ''))
    .filter((id) => mongoose.isValidObjectId(id))
}

/**
 * RealEstate filter for the companies whose debt the caller may see within
 * the requested domains. The scope comes from ownership, not from the ids the
 * client sent: requesting a foreign domain or company yields nothing.
 *
 * - GlobalAdmin: every company in the requested domains.
 * - DomainAdmin: companies of the requested domains they administer, plus
 *   companies they administer themselves.
 * - anyone else (User / no role): only companies listing them in adminEmails.
 */
export async function getDebtorCompaniesFilter(
  { isGlobalAdmin, isDomainAdmin, user }: IDomainAccessUser,
  domainIds: string[]
): Promise<QueryFilter<IRealEstateModel> | null> {
  if (!domainIds.length) return null

  const inRequestedDomains = { domain: { $in: domainIds } }

  if (isGlobalAdmin) return inRequestedDomains

  const email = user?.email
  if (!email) return null

  if (isDomainAdmin) {
    const ownedDomains = await Domain.find({
      _id: { $in: domainIds },
      adminEmails: email,
    })
      .select('_id')
      .lean()

    return {
      ...inRequestedDomains,
      $or: [
        { domain: { $in: ownedDomains.map(({ _id }) => _id) } },
        { adminEmails: email },
      ],
    }
  }

  return { ...inRequestedDomains, adminEmails: email }
}
