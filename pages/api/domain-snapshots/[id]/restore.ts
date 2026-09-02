import Domain from '@modules/models/Domain'
import DomainCustomServicesSnapshot from '@modules/models/domain-custom-services-snapshot'
import { Data } from '@pages/api/api.config'
import { withErrorHandler } from '@utils/api-handler'
import { getCurrentUser } from '@utils/getCurrentUser'
import mongoose from 'mongoose'
import type { NextApiRequest, NextApiResponse } from 'next'

async function restoreSnapshotHandler(
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

  const id = String(req.query.id ?? '')
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'invalid id' })
  }

  const snapshot = await DomainCustomServicesSnapshot.findById(id).lean()
  if (!snapshot) {
    return res
      .status(404)
      .json({ success: false, message: 'snapshot not found' })
  }

  const domain = await Domain.findById(snapshot.domainId)
  if (!domain) {
    return res.status(404).json({ success: false, message: 'domain not found' })
  }

  domain.customServices = snapshot.groups.map((g) => ({
    groupName: g.groupName,
    services: g.services.map(String),
  })) as typeof domain.customServices
  domain.domainTypeTemplateId = snapshot.templateId ?? undefined
  await domain.save()

  return res.status(200).json({
    success: true,
    data: {
      restored: true,
      domainId: String(snapshot.domainId),
      templateId: snapshot.templateId ? String(snapshot.templateId) : null,
    },
  })
}

export default withErrorHandler(restoreSnapshotHandler)
