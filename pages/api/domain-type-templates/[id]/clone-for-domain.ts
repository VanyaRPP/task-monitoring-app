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

  const domainObjectId = new mongoose.Types.ObjectId(rawDomainId)
  const existingDomainServices = uniqueOriginalIds.length
    ? await CustomService.find({ domain: domainObjectId }).lean()
    : []

  const serviceKey = (s: any): string => {
    const fieldName = String(s?.fieldName ?? '')
      .trim()
      .toLowerCase()
    if (fieldName) return `f:${fieldName}`
    const name = String(s?.name ?? '')
      .trim()
      .toLowerCase()
    return name ? `n:${name}` : ''
  }

  const existingByKey = new Map<string, any>()
  for (const s of existingDomainServices) {
    const key = serviceKey(s)
    if (key && !existingByKey.has(key)) existingByKey.set(key, s)
  }

  const oldToNew = new Map<string, mongoose.Types.ObjectId>()
  let clonedCount = 0
  let reusedCount = 0
  for (const oldId of uniqueOriginalIds) {
    const orig = originalById.get(oldId)
    if (!orig) continue

    const key = serviceKey(orig)
    const existing = key ? existingByKey.get(key) : undefined
    if (existing) {
      oldToNew.set(oldId, existing._id as mongoose.Types.ObjectId)
      reusedCount++
      continue
    }

    const created = await CustomService.create({
      name: orig.name,
      fieldName: orig.fieldName,
      ...(orig.serviceType ? { serviceType: orig.serviceType } : {}),
      domain: domainObjectId,
    })
    oldToNew.set(oldId, created._id as mongoose.Types.ObjectId)
    if (key) existingByKey.set(key, created)
    clonedCount++
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
      clonedCount,
      reusedCount,
      missingCount: uniqueOriginalIds.length - oldToNew.size,
    },
  })
}

export default withErrorHandler(cloneForDomainHandler)
