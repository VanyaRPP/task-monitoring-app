import start from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'
import {
  createPayment,
  getPayments,
} from '@common/services/paymentService/payment.service'
import RealEstate from '@common/modules/models/RealEstate'
import Domain from '@modules/models/Domain'

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
      if (isAdmin) {
        const scope = req.body._templateScope
        const templateKey = req.body.template
        const companyId = req.body.company
        const domainId = req.body.domain

        if (scope && templateKey) {
          if (scope === 'company' && companyId) {
            await RealEstate.findByIdAndUpdate(companyId, {
              $set: { defaultTemplate: templateKey },
            })
          } else if (scope === 'domain' && domainId) {
            await Domain.findByIdAndUpdate(domainId, {
              $set: { defaultTemplate: templateKey },
            })
          }
        }

        /* eslint-disable @typescript-eslint/ban-ts-comment */
        // @ts-ignore
        const payment = await createPayment(req.body, isAdmin)
        return res.status(200).json({ success: true, data: payment })
      } else {
        return res.status(400).json({ success: false, message: 'not allowed' })
      }
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error?.message || error })
    }
  }
}