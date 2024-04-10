/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import Payment from '@common/modules/models/Payment'
import Domain from '@common/modules/models/Domain'
import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { isGlobalAdmin, isDomainAdmin, user } = await getCurrentUser(req, res)

  switch (req.method) {
    case 'DELETE':
      try {
        if (!isDomainAdmin && !isGlobalAdmin) {
          throw new Error('not allowed')
        }

        if (isDomainAdmin) {
          const payment = await Payment.findById(req.query.id)
          const domain = await Domain.findById(payment.domain)

          if (!domain) {
            throw new Error('unknown domain')
          }

          if (!domain.adminEmails.includes(user.email)) {
            throw new Error('uncontrolled domain')
          }

          const deleted = await Payment.findByIdAndRemove(req.query.id)

          if (!deleted) {
            throw new Error('failed to delete')
          }

          return res.status(200).json({ success: true, data: deleted })
        }

        if (isGlobalAdmin) {
          const deleted = await Payment.findByIdAndRemove(req.query.id)

          if (!deleted) {
            throw new Error('failed to delete')
          }

          return res.status(200).json({ success: true, data: deleted })
        }

        throw new Error('unexpected response')
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }

    case 'PATCH':
      try {
        if (isDomainAdmin) {
          const domain = await Domain.findOne({
            _id: req.body.domain,
            adminEmails: { $in: [user.email] },
          })

          if (domain) {
            const response = await Payment.findOneAndUpdate(
              { _id: req.query.id },
              req.body,
              { new: true }
            )
            return res.status(200).json({ success: true, data: response })
          }
        }

        if (isGlobalAdmin) {
          const response = await Payment.findOneAndUpdate(
            { _id: req.query.id },
            req.body,
            { new: true }
          )
          return res.status(200).json({ success: true, data: response })
        }

        return res.status(400).json({ success: false, message: 'not allowed' })
      } catch (error) {
        return res.status(400).json({ success: false, error: error.message })
      }
  }
}
