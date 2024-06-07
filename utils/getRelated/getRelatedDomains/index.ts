import Domain, { IDomain } from '@common/modules/models/Domain'
import RealEstate from '@common/modules/models/RealEstate'
import { UserData } from '@utils/getUserData'
import { toQuery } from '@utils/toQuery'
import { NextApiRequest, NextApiResponse } from 'next'

/**
 * @returns list of domain id's related to current user
 */
export async function getRelatedDomains(
  req: NextApiRequest,
  res: NextApiResponse,
  user: UserData
): Promise<IDomain['_id'][] | void> {
  const { domainId: _domainId } = req.query

  const domainId = toQuery(_domainId)

  if (user.isGlobalAdmin) {
    return (await Domain.distinct('_id')).map((id) => id.toString())
  }

  if (user.isDomainAdmin) {
    const domains = [
      ...(await Domain.distinct('_id', { adminEmails: user.email })),
      ...(await RealEstate.distinct('domain', { adminEmails: user.email })),
    ].map((id) => id.toString())

    if (domainId?.filter((id) => !domains.includes(id)).length) {
      return res.status(403).json({
        error: 'restricte access to filter by domainId not related to you',
      })
    }

    return domains
  }

  const domains = (
    await RealEstate.distinct('domain', { adminEmails: user.email })
  ).map((id) => id.toString())

  if (domainId?.filter((id) => !domains.includes(id)).length) {
    return res.status(403).json({
      error: 'restricte access to filter by domainId not related to you',
    })
  }

  return domains
}
