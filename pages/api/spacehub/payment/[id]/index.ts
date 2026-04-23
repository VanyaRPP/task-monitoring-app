/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import PaymentChangeLog from '@common/modules/models/PaymentChangeLog'
import Payment from '@common/modules/models/Payment'
import RealEstate from '@common/modules/models/RealEstate'
import { IPayment } from '@common/api/paymentApi/payment.api.types'
import Domain from '@modules/models/Domain'
import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'
import ProfitService from '@common/services/profitService/profit.service'
import payment from '@pages/payment'
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
          await ProfitService.deleteByIdPayment(req.query.id as string)
          return res.status(200).json({ success: true, data: deleted })
        }

        throw new Error('unexpected response')
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }

    case 'PATCH':
      try {
        const current = await Payment.findById(req.query.id)
        if (!current) throw new Error('Payment not found')
          const isTemplateUpdate = typeof req.body.template !== 'undefined' && req.body.invoice === undefined
    if (isTemplateUpdate) {
      if (!isGlobalAdmin && !isDomainAdmin) {
        return res.status(403).json({ success: false, message: 'not allowed' })
      }

      const templateKey = req.body.template
      const scope = req.body._templateScope
    
      if (scope === 'company') {
        if (!isGlobalAdmin) {
          return res.status(403).json({ success: false, message: 'not allowed' })
        }
        await RealEstate.findByIdAndUpdate(current.company, { $set: { defaultTemplate: templateKey } })
        return res.status(200).json({ success: true })
      }

      if (scope === 'domain') {
        if (!isGlobalAdmin) {
          const domain = await Domain.findOne({ _id: current.domain, adminEmails: { $in: [user.email] } })
          if (!domain) {
            return res.status(403).json({ success: false, message: 'not allowed' })
          }
        }
        await Domain.findByIdAndUpdate(current.domain, { $set: { defaultTemplate: templateKey } })
        return res.status(200).json({ success: true })
      }

      const response = await Payment.findOneAndUpdate(
        { _id: req.query.id },
        { $set: { template: templateKey } },
        { new: true }
      )

      return res.status(200).json({ success: true, data: response })
    }

        await PaymentChangeLog.create({
          paymentId: current._id,
          date: new Date(),
          reason: 'edit-payment',
          actorId: user?._id,
          actorEmail: user?.email,
          invoiceData: {
            invoiceNumber: current.invoiceNumber,
            invoiceCreationDate: current.invoiceCreationDate,
            invoice: current.invoice,
            provider: current.provider,
            reciever: current.reciever,
            generalSum: current.generalSum,
            description: current.description,
            type: current.type,
            template: req.body.template,
          },
        })
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
          return res.status(403).json({ success: false, message: 'not allowed' })
        }

        if (isGlobalAdmin) {
          const response = await Payment.findOneAndUpdate(
            { _id: req.query.id },
            req.body,
            { new: true }
          )

          const description =
            response.type === 'debit'
              ? `Інвойс №${response.invoiceNumber}`
              : response.description

          const profitObject = {
            type: response.type,
            date: response.invoiceCreationDate,
            amount: response.generalSum,
            description,
            invoiceNumber: response.invoiceNumber,
          }

          await ProfitService.updatePayment(
            req.query.id as string,
            profitObject
          )

          return res.status(200).json({ success: true, data: response })
        }

        return res.status(400).json({ success: false, message: 'not allowed' })
      } catch (error: any) {
        return res.status(400).json({ success: false, error: error.message })
      }
  }
}
