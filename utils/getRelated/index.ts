import Domain, { IDomain } from '@common/modules/models/Domain'
import RealEstate from '@common/modules/models/RealEstate'
import Service, { IService } from '@common/modules/models/Service'
import Street, { IStreet } from '@common/modules/models/Street'
import { UserData } from '@utils/getUserData'
import { toQuery } from '@utils/toQuery'
import { NextApiRequest, NextApiResponse } from 'next'

/**
 * TODO: maybe return all allowed items and error about restriction to notallowed items at the same time
 *
 * return {
 *   data: RelatedItems,
 *   error?: any
 * }
 */

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
      error:
        'restricte access to filter by streetId not related to your company',
    })
  }

  return streets
}

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
      error:
        'restricte access to filter by domainId not related to your company',
    })
  }

  return domains
}

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
      error:
        'restricte access to filter by serviceId not related to your company',
    })
  }

  return services
}
