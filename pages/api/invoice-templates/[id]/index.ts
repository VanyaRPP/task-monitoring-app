import InvoiceTemplate from '@common/modules/models/InvoiceTemplate'
import { Data } from '@pages/api/api.config'
import { withErrorHandler } from '@utils/api-handler'
import { getCurrentUser } from '@utils/getCurrentUser'
import mongoose from 'mongoose'
import type { NextApiRequest, NextApiResponse } from 'next'

async function invoiceTemplateByIdHandler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { user } = await getCurrentUser(req, res)
  const id = req.query.id as string

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid id' })
  }

  switch (req.method) {
    case 'PATCH': {
      const {
        name,
        providerDescription,
        receiverDescription,
        overrides,
        baseTemplateKey,
      } = req.body ?? {}

      const update: Record<string, unknown> = {}
      if (name !== undefined) update.name = String(name).trim()
      if (providerDescription !== undefined)
        update.providerDescription = String(providerDescription)
      if (receiverDescription !== undefined)
        update.receiverDescription = String(receiverDescription)
      if (overrides !== undefined) update.overrides = overrides
      if (baseTemplateKey !== undefined)
        update.baseTemplateKey = String(baseTemplateKey)

      const updated = await InvoiceTemplate.findOneAndUpdate(
        { _id: id, isBuiltIn: false },
        { $set: update },
        { new: true }
      ).lean()

      if (!updated) {
        return res
          .status(404)
          .json({ success: false, message: 'Template not found' })
      }
      return res.status(200).json({ success: true, data: updated })
    }

    case 'DELETE': {
      const deleted = await InvoiceTemplate.findOneAndDelete({
        _id: id,
        isBuiltIn: false,
      }).lean()

      if (!deleted) {
        return res
          .status(404)
          .json({ success: false, message: 'Template not found' })
      }
      return res.status(200).json({ success: true, data: { _id: id } })
    }

    default:
      return res
        .status(405)
        .json({ success: false, message: `Method ${req.method} not allowed` })
  }
}

export default withErrorHandler(invoiceTemplateByIdHandler)
