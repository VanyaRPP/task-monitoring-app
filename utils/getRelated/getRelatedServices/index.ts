import { IService } from '@common/api/serviceApi/service.api.types'
import Domain from '@common/modules/models/Domain'
import RealEstate from '@common/modules/models/RealEstate'
import Service from '@common/modules/models/Service'
import { UserData } from '@utils/getUserData'
import { toQuery } from '@utils/toQuery'
import { NextApiRequest, NextApiResponse } from 'next'

/**
 * @returns list of service id's related to current user
 */
export async function getRelatedServices(
  req: NextApiRequest,
  res: NextApiResponse,
  user: UserData
): Promise<IService['_id'][] | void> {
  const { serviceId: _serviceId } = req.query

  const serviceId = toQuery(_serviceId)

  if (user.isGlobalAdmin) {
    return (await Service.distinct('_id')).map((id) => id.toString())
  }

  if (user.isDomainAdmin) {
    const domains = [
      ...(await Domain.distinct('_id', { adminEmails: user.email })),
      ...(await RealEstate.distinct('domain', { adminEmails: user.email })),
    ].map((id) => id.toString())

    const services = (
      await Service.distinct('_id', { domain: { $in: domains } })
    ).map((id) => id.toString())

    if (serviceId?.filter((id) => !services.includes(id)).length) {
      return res.status(403).json({
        error: 'restricte access to filter by serviceId not related to you',
      })
    }

    return services
  }

  const domains = (
    await RealEstate.distinct('domain', { adminEmails: user.email })
  ).map((id) => id.toString())

  const services = (
    await Service.distinct('_id', { domain: { $in: domains } })
  ).map((id) => id.toString())

  if (serviceId?.filter((id) => !services.includes(id)).length) {
    return res.status(403).json({
      error: 'restricte access to filter by serviceId not related to you',
    })
  }

  return services
}
