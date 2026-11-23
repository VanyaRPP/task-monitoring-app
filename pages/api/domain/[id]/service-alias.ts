import Domain from '@modules/models/Domain'
import { Data } from '@pages/api/api.config'
import { withErrorHandler } from '@utils/api-handler'
import { getCurrentUser } from '@utils/getCurrentUser'
import { canEditDomain } from '@utils/domain/domain-access'
import {
  MAX_SERVICE_ALIAS_LENGTH,
  normalizeAlias,
  upsertServiceAlias,
} from '@utils/domain/service-display'
import { ServiceType } from '@utils/constants'
import mongoose from 'mongoose'
import type { NextApiRequest, NextApiResponse } from 'next'

const SERVICE_TYPES = new Set<string>(Object.values(ServiceType))

/**
 * @swagger
 * /api/domain/{id}/service-alias:
 *   put:
 *     summary: Set or clear the client-facing alias of a service in a domain
 *     description: Empty alias removes it. GlobalAdmin or admin of the domain.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [serviceId]
 *             properties:
 *               serviceId: { type: string }
 *               serviceType: { type: string }
 *               alias: { type: string, maxLength: 120 }
 *     responses:
 *       200: { description: Updated alias list in data }
 *       400: { description: Invalid input }
 *       403: { description: Not an admin of this domain }
 */
async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== 'PUT') return res.status(405).end()

  const access = await getCurrentUser(req, res)
  if (!access.isAdmin) {
    return res.status(403).json({ success: false, message: 'Access denied' })
  }

  const domainId = req.query.id
  if (!(await canEditDomain(access, domainId))) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: not an admin of this domain',
    })
  }

  const { serviceId, serviceType, fieldName, serviceName, alias } =
    req.body ?? {}
  if (
    typeof serviceId !== 'string' ||
    !mongoose.isValidObjectId(serviceId) ||
    (alias !== undefined && typeof alias !== 'string')
  ) {
    return res.status(400).json({ success: false, message: 'Invalid input' })
  }
  if (normalizeAlias(alias).length > MAX_SERVICE_ALIAS_LENGTH) {
    return res.status(400).json({ success: false, message: 'Alias too long' })
  }

  const domain = await Domain.findById(domainId).select('serviceAliases')
  const next = upsertServiceAlias(domain?.serviceAliases, {
    serviceId,
    serviceType:
      typeof serviceType === 'string' && SERVICE_TYPES.has(serviceType)
        ? serviceType
        : undefined,
    fieldName: typeof fieldName === 'string' ? fieldName : undefined,
    serviceName: typeof serviceName === 'string' ? serviceName : undefined,
    alias,
  })
  await Domain.updateOne({ _id: domainId }, { $set: { serviceAliases: next } })

  return res.status(200).json({ success: true, data: next })
}

export default withErrorHandler(async (req, res) => {
  await handler(req, res)
})
