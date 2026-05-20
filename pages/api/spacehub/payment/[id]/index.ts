import PaymentChangeLog from '@common/modules/models/PaymentChangeLog'
import Payment from '@common/modules/models/Payment'
import Domain from '@modules/models/Domain'
import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'
import ProfitService from '@common/services/profitService/profit.service'
import { applyTemplateScope } from '@common/services/paymentService/templateScope.service'

start()

const PROTECTED_PATCH_FIELDS = ['_id', 'domain', 'company', '_templateScope']

const sanitizePatchBody = (body: Record<string, any>) => {
  const sanitized: Record<string, any> = { ...body }
  for (const f of PROTECTED_PATCH_FIELDS) {
    delete sanitized[f]
  }
  return sanitized
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  let perms: Awaited<ReturnType<typeof getCurrentUser>>
  try {
    perms = await getCurrentUser(req, res)
  } catch (error: any) {
    return res
      .status(401)
      .json({ success: false, message: error?.message ?? 'unauthorized' })
  }
  const { isDomainAdmin, isUser, isGlobalAdmin, user } = perms

  switch (req.method) {
    case 'GET':
      try {
        if (!req.query.id) {
          return res
            .status(400)
            .json({ success: false, message: "'id' is not provided" })
        }

        const payment: any = await Payment.findById(req.query.id)
          .populate('domain')
          .populate('company')
          .populate('street')
          .populate('monthService')

        if (!payment) {
          return res
            .status(404)
            .json({ success: false, message: 'Payment not found' })
        }

        if (isGlobalAdmin) {
          return res.status(200).json({ success: true, data: payment })
        }

        if (
          isDomainAdmin &&
          payment.domain?.adminEmails?.includes(user.email)
        ) {
          return res.status(200).json({ success: true, data: payment })
        }

        if (isUser && payment.company?.adminEmails?.includes(user.email)) {
          return res.status(200).json({ success: true, data: payment })
        }

        return res.status(403).json({ success: false, message: 'not allowed' })
      } catch (error: any) {
        return res
          .status(400)
          .json({ success: false, error: error?.message ?? 'unknown error' })
      }

    case 'DELETE':
      try {
        if (!isDomainAdmin && !isGlobalAdmin) {
          return res
            .status(403)
            .json({ success: false, message: 'not allowed' })
        }

        const payment = await Payment.findById(req.query.id)
        if (!payment) {
          return res
            .status(404)
            .json({ success: false, message: 'Payment not found' })
        }

        if (isDomainAdmin && !isGlobalAdmin) {
          const domain = await Domain.findById(payment.domain)
          if (!domain || !domain.adminEmails.includes(user.email)) {
            return res
              .status(403)
              .json({ success: false, message: 'not allowed' })
          }
        }

        const deleted = await Payment.findByIdAndRemove(req.query.id)
        if (!deleted) {
          return res
            .status(500)
            .json({ success: false, message: 'failed to delete' })
        }

        if (isGlobalAdmin) {
          await ProfitService.deleteByIdPayment(req.query.id as string)
        }

        return res.status(200).json({ success: true, data: deleted })
      } catch (error: any) {
        return res
          .status(400)
          .json({ success: false, error: error?.message ?? 'unknown error' })
      }

    case 'PATCH':
      try {
        const current: any = await Payment.findById(req.query.id)
        if (!current) {
          return res
            .status(404)
            .json({ success: false, message: 'Payment not found' })
        }

        const templateKey = req.body.template
        const scope = req.body._templateScope

        const scopeResult = await applyTemplateScope({
          scope,
          templateKey,
          companyId: current.company?.toString(),
          domainId: current.domain?.toString(),
          perms: { isGlobalAdmin, isDomainAdmin, user },
        })

        if (scopeResult.kind === 'forbidden') {
          return res
            .status(403)
            .json({ success: false, message: scopeResult.message })
        }

        const isTemplateUpdate =
          typeof req.body.template !== 'undefined' &&
          req.body.invoice === undefined

        if (isTemplateUpdate) {
          if (!isGlobalAdmin && !isDomainAdmin) {
            return res
              .status(403)
              .json({ success: false, message: 'not allowed' })
          }

          const response = await Payment.findOneAndUpdate(
            { _id: req.query.id },
            { $set: { template: templateKey } },
            { new: true }
          )

          return res.status(200).json({ success: true, data: response })
        }

        if (!isGlobalAdmin && !isDomainAdmin) {
          return res
            .status(403)
            .json({ success: false, message: 'not allowed' })
        }

        if (isDomainAdmin && !isGlobalAdmin) {
          const domain = await Domain.findOne({
            _id: current.domain,
            adminEmails: { $in: [user.email] },
          })
          if (!domain) {
            return res
              .status(403)
              .json({ success: false, message: 'not allowed' })
          }
        }

        const update = sanitizePatchBody(req.body)

        const response: any = await Payment.findOneAndUpdate(
          { _id: req.query.id },
          update,
          { new: true }
        )

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
            template: current.template,
          },
        })

        if (isGlobalAdmin) {
          const description =
            response.type === 'debit'
              ? `Інвойс №${response.invoiceNumber}`
              : response.description

          await ProfitService.updatePayment(req.query.id as string, {
            type: response.type as 'debit' | 'credit',
            date: response.invoiceCreationDate,
            amount: response.generalSum,
            description,
            invoiceNumber: String(response.invoiceNumber),
          })
        }

        return res.status(200).json({ success: true, data: response })
      } catch (error: any) {
        return res
          .status(400)
          .json({ success: false, error: error?.message ?? 'unknown error' })
      }

    default:
      return res
        .status(405)
        .json({ success: false, message: 'Method not allowed' })
  }
}
