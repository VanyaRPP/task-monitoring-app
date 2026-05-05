import CustomService from '@modules/models/CustomService'
import Domain from '@modules/models/Domain'
import DomainTypeTemplate from '@modules/models/domain-type-template'
import start, { Data } from '@pages/api/api.config'
import { withErrorHandler } from '@utils/api-handler'
import { getCurrentUser } from '@utils/getCurrentUser'
import mongoose from 'mongoose'
import type { NextApiRequest, NextApiResponse } from 'next'

start()

async function cloneForDomainHandler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    return res
      .status(405)
      .json({ success: false, message: `Метод ${req.method} не дозволений` })
  }

  const { isAdmin } = await getCurrentUser(req, res)
  if (!isAdmin) {
    return res.status(403).json({ success: false, message: 'Немає доступу' })
  }

  const templateId = String(req.query.id ?? '')
  if (!mongoose.Types.ObjectId.isValid(templateId)) {
    return res
      .status(400)
      .json({ success: false, message: 'invalid template id' })
  }

  const rawDomainId = String(req.body?.domainId ?? '')
  if (!mongoose.Types.ObjectId.isValid(rawDomainId)) {
    return res.status(400).json({ success: false, message: 'invalid domainId' })
  }

  const template = await DomainTypeTemplate.findById(templateId).lean()
  if (!template) {
    return res
      .status(404)
      .json({ success: false, message: 'template not found' })
  }

  const domain = await Domain.findById(rawDomainId).lean()
  if (!domain) {
    return res.status(404).json({ success: false, message: 'domain not found' })
  }

  const originalIds = (template.groups ?? []).flatMap((g) =>
    (g.serviceIds ?? []).map((id) => String(id))
  )
  const uniqueOriginalIds = Array.from(new Set(originalIds))
  const originals = uniqueOriginalIds.length
    ? await CustomService.find({
        _id: { $in: uniqueOriginalIds },
      }).lean()
    : []
  const originalById = new Map<string, any>(
    originals.map((s) => [String(s._id), s])
  )

  const oldToNew = new Map<string, mongoose.Types.ObjectId>()
  for (const oldId of uniqueOriginalIds) {
    const orig = originalById.get(oldId)
    if (!orig) continue
    const created = await CustomService.create({
      name: orig.name,
      fieldName: orig.fieldName,
      ...(orig.serviceType ? { serviceType: orig.serviceType } : {}),
      domain: new mongoose.Types.ObjectId(rawDomainId),
    })
    oldToNew.set(oldId, created._id as mongoose.Types.ObjectId)
  }

  const newGroups = (template.groups ?? []).map((g) => ({
    groupName: g.groupName,
    services: (g.serviceIds ?? [])
      .map((id) => oldToNew.get(String(id)))
      .filter(Boolean)
      .map((id) => String(id)),
  }))

  return res.status(201).json({
    success: true,
    data: {
      groups: newGroups,
      clonedCount: oldToNew.size,
      missingCount: uniqueOriginalIds.length - oldToNew.size,
    },
  })
}

export default withErrorHandler(cloneForDomainHandler)
