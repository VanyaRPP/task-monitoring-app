import start from '@pages/api/api.config'

import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'

import {
  createPayment,
  getPayments,
} from '@common/services/paymentService/payment.service'
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
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message })
    }
  } else if (req.method === 'POST') {
    try {
      if (isAdmin) {
        /* eslint-disable @typescript-eslint/ban-ts-comment */
        // @ts-ignore
        const payment = await createPayment(req.body, isAdmin)
        return res.status(200).json({ success: true, data: payment })
      } else {
        return (
          res
            .status(400)
            /* eslint-disable @typescript-eslint/ban-ts-comment */
            // @ts-ignore
            .json({ success: false, message: 'not allowed' })
        )
      }
    } catch (error) {
      // const errors = postValidateBody(req)
      /* eslint-disable @typescript-eslint/ban-ts-comment */
      // @ts-ignore
      return res.status(400).json({ success: false, message: error })
    }
  }
}
