import CustomService from '@modules/models/CustomService'
import Domain from '@modules/models/Domain'
import { Data } from '@pages/api/api.config'
import { withErrorHandler } from '@utils/api-handler'
import { ServiceType } from '@utils/constants'
import { builtInServiceIdsForType } from '@utils/domain/housing-fee-access'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'

const SERVICE_TYPE_VALUES = new Set<string>(Object.values(ServiceType))

/**
 * Domains whose catalog carries a service of the given `serviceType`.
 *
 * Two lookups, because a domain's catalog gets filled in two ways:
 * - by cloning a template, which yields `CustomService` copies with a `domain`;
 * - the old way, where the domain's groups reference a GLOBAL service
 *   directly, so the pinned `_id`s of the built-in services must match too.
 */
async function domainsByServiceTypeHandler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'GET') {
    return res
      .status(405)
      .json({ success: false, message: `Метод ${req.method} не дозволений` })
  }

  const { isAdmin } = await getCurrentUser(req, res)
  if (!isAdmin) {
    return res.status(403).json({ success: false, message: 'Немає доступу' })
  }

  const type = String(req.query.type ?? '')
  if (!SERVICE_TYPE_VALUES.has(type) || type === ServiceType.Custom) {
    return res
      .status(400)
      .json({ success: false, message: `Невідомий тип послуги: ${type}` })
  }

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
    ...builtInServiceIdsForType(type as ServiceType),
    ...globalServices.map(({ _id }) => String(_id)),
  ])

  if (globalIds.size > 0) {
    const referencing = await Domain.find(
      { 'customServices.services': { $in: [...globalIds] } },
      '_id'
    ).lean()
    referencing.forEach(({ _id }) => domainIds.add(String(_id)))
  }

  return res.status(200).json({ success: true, data: [...domainIds] })
}

export default withErrorHandler(domainsByServiceTypeHandler)
