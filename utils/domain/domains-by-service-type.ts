import CustomService from '@modules/models/CustomService'
import Domain from '@modules/models/Domain'
import { ServiceType } from '@utils/constants'
import { builtInServiceIdsForType } from './housing-fee-access'

export async function findDomainIdsByServiceType(
  type: ServiceType
): Promise<string[]> {
  const scoped = await CustomService.find(
    { serviceType: type, domain: { $ne: null } },
    'domain'
  ).lean()
  const domainIds = new Set(scoped.map(({ domain }) => String(domain)))

  const globalServices = await CustomService.find(
    { serviceType: type, domain: null },
    '_id'
  ).lean()
  const globalIds = new Set([
    ...builtInServiceIdsForType(type),
    ...globalServices.map(({ _id }) => String(_id)),
  ])

  if (globalIds.size > 0) {
    const referencing = await Domain.find(
      { 'customServices.services': { $in: [...globalIds] } },
      '_id'
    ).lean()
    referencing.forEach(({ _id }) => domainIds.add(String(_id)))
  }

  return [...domainIds]
}
