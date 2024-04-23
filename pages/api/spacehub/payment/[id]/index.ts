/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { IPayment } from '@common/api/paymentApi/payment.api.types'
import Domain from '@common/modules/models/Domain'
import Payment from '@common/modules/models/Payment'
import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { isDomainAdmin, isUser, isGlobalAdmin, user } = await getCurrentUser(
    req,
    res
  )

  switch (req.method) {
    case 'GET':
      try {
        if (!req.query.id) throw new Error("'id' is not provided")

        const payment: IPayment = await Payment.findById(req.query.id)
          .populate('domain')
          .populate('company')
          .populate('street')
          .populate('monthService')

        if (isGlobalAdmin) {
          return res.status(200).json({ success: true, data: payment })
        }

        if (isDomainAdmin) {
          if (payment.domain.adminEmails.includes(user.email)) {
            return res.status(200).json({
              success: true,
              data: payment,
            })
          }
        }

        if (isUser) {
          if (payment.company.adminEmails.includes(user.email)) {
            return res.status(200).json({
              success: true,
              data: payment,
            })
          }
        }

        return res.status(200).json({ success: false, data: {} })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }

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
