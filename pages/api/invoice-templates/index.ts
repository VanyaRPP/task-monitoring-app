import InvoiceTemplate from '@common/modules/models/InvoiceTemplate'
import { Data } from '@pages/api/api.config'
import { withErrorHandler } from '@utils/api-handler'
import { getCurrentUser } from '@utils/getCurrentUser'
import mongoose from 'mongoose'
import type { NextApiRequest, NextApiResponse } from 'next'

async function invoiceTemplatesHandler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { user } = await getCurrentUser(req, res)

  switch (req.method) {
    case 'GET': {
      const domainId = req.query.domainId as string | undefined
      if (!domainId || !mongoose.Types.ObjectId.isValid(domainId)) {
        return res
          .status(400)
          .json({ success: false, message: 'domainId is required' })
      }
      const templates = await InvoiceTemplate.find({
        domainId: new mongoose.Types.ObjectId(domainId),
        isBuiltIn: false,
      })
        .sort({ createdAt: -1 })
        .lean()
      return res.status(200).json({ success: true, data: templates })
    }

    case 'POST': {
      const {
        name,
        baseTemplateKey,
        providerDescription,
        receiverDescription,
        overrides,
        domainId,
      } = req.body ?? {}

      if (!name?.trim()) {
        return res
          .status(400)
          .json({ success: false, message: 'Потрібна назва шаблону' })
      }
      if (!domainId || !mongoose.Types.ObjectId.isValid(domainId)) {
        return res
          .status(400)
          .json({ success: false, message: 'domainId is required' })
      }

      const created = await InvoiceTemplate.create({
        name: String(name).trim(),
        baseTemplateKey: String(baseTemplateKey || 'classic').trim(),
        providerDescription: String(providerDescription || ''),
        receiverDescription: String(receiverDescription || ''),
        ...(overrides !== undefined ? { overrides } : {}),
        domainId: new mongoose.Types.ObjectId(domainId),
        isBuiltIn: false,
        createdBy: user._id,
      })
      return res.status(201).json({ success: true, data: created })
    }

    default:
      return res
        .status(405)
        .json({ success: false, message: `Method ${req.method} not allowed` })
  }
}

export default withErrorHandler(invoiceTemplatesHandler)
