import mongoose from 'mongoose'
import start from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'
import {
  createPayment,
  getPayments,
} from '@common/services/paymentService/payment.service'
import { applyTemplateScope } from '@common/services/paymentService/templateScope.service'
import { logPaymentMutation } from '@common/modules/services/paymentAudit'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { isUser, isDomainAdmin, isGlobalAdmin, isAdmin, user } =
    await getCurrentUser(req, res)

  if (req.method === 'GET') {
    try {
      const result = await getPayments(req.query, {
        isUser,
        isDomainAdmin,
        isGlobalAdmin,
        user,
      })
      return res.status(200).json(result)
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message })
    }
  } else if (req.method === 'POST') {
    try {
      if (!isAdmin) {
        return res.status(403).json({ success: false, message: 'not allowed' })
      }

      const { _templateScope, _bulk, _batchId, ...paymentBody } = req.body ?? {}

      const scopeResult = await applyTemplateScope({
        scope: _templateScope,
        templateKey: paymentBody.template,
        companyId: paymentBody.company,
        domainId: paymentBody.domain,
        perms: { isGlobalAdmin, isDomainAdmin, user },
      })

      if (scopeResult.kind === 'forbidden') {
        return res
          .status(403)
          .json({ success: false, message: scopeResult.message })
      }

      const payment = await createPayment(paymentBody, isAdmin)

      const isBulk = Boolean(_bulk)
      await logPaymentMutation({
        actionType: isBulk ? 'BULK_CREATE' : 'CREATE',
        source: isBulk ? 'bulk' : 'single',
        actor: user,
        after: payment,
        batchId:
          isBulk && mongoose.Types.ObjectId.isValid(_batchId)
            ? _batchId
            : undefined,
      })

      return res.status(200).json({ success: true, data: payment })
    } catch (error: any) {
      return res
        .status(400)
        .json({ success: false, message: error?.message || error })
    }
  }
}
