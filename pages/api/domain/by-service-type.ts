import { Data } from '@pages/api/api.config'
import { withErrorHandler } from '@utils/api-handler'
import { ServiceType } from '@utils/constants'
import { findDomainIdsByServiceType } from '@utils/domain/domains-by-service-type'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'

const SERVICE_TYPE_VALUES = new Set<string>(Object.values(ServiceType))

/**
 * Domains whose catalog carries a service of the given `serviceType`; see
 * {@link findDomainIdsByServiceType} for how both catalog layouts are matched.
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

  const domainIds = await findDomainIdsByServiceType(type as ServiceType)

  return res.status(200).json({ success: true, data: domainIds })
}

export default withErrorHandler(domainsByServiceTypeHandler)
