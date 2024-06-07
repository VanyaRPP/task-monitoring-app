import Domain from '@common/modules/models/Domain'
import RealEstate from '@common/modules/models/RealEstate'
import Street, { IStreet } from '@common/modules/models/Street'
import { UserData } from '@utils/getUserData'
import { toQuery } from '@utils/toQuery'
import { NextApiRequest, NextApiResponse } from 'next'

/**
 * @returns list of street id's related to current user
 */
export async function getRelatedStreets(
  req: NextApiRequest,
  res: NextApiResponse,
  user: UserData
): Promise<IStreet['_id'][] | void> {
  const { streetId: _streetId } = req.query

  const streetId = toQuery(_streetId)

  if (user.isGlobalAdmin) {
    return (await Street.distinct('_id')).map((id) => id.toString())
  }

  if (user.isDomainAdmin) {
    const domainId = [
      ...(await Domain.distinct('_id', { adminEmails: user.email })),
      ...(await RealEstate.distinct('domain', { adminEmails: user.email })),
    ].map((id) => id.toString())

    const streets = (
      await Domain.distinct('streets', {
        _id: { $in: domainId },
      })
    ).map((id) => id.toString())

    if (streetId?.filter((id) => !streets.includes(id)).length) {
      return res.status(403).json({
        error: 'restricte access to filter by streetId not related to you',
      })
    }

    return streets
  }

  const streets = (
    await RealEstate.distinct('street', { adminEmails: user.email })
  ).map((id) => id.toString())

  if (streetId?.filter((id) => !streets.includes(id)).length) {
    return res.status(403).json({
      error: 'restricte access to filter by streetId not related to you',
    })
  }

  return streets
}
