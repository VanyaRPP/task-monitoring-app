import Payment from '@common/modules/models/Payment'
import PaymentChangeLog from '@common/modules/models/PaymentChangeLog'
import Domain from '@modules/models/Domain'
import start, { Data } from '@pages/api/api.config'
import ProfitService from '@common/services/profitService/profit.service'
import { getCurrentUser } from '@utils/getCurrentUser'
import { Operations } from '@utils/constants'
import { dateShiftMs } from '@common/assets/features/formatDate'
import type { NextApiRequest, NextApiResponse } from 'next'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    return res
      .status(405)
      .json({ success: false, message: 'Method not allowed' })
  }

  let perms
  try {
    perms = await getCurrentUser(req, res)
  } catch (error: any) {
    return res
      .status(401)
      .json({ success: false, message: error?.message ?? 'unauthorized' })
  }
  const { isDomainAdmin, isGlobalAdmin, user } = perms

  if (!isDomainAdmin && !isGlobalAdmin) {
    return res.status(403).json({ success: false, message: 'not allowed' })
  }

  const { ids } = (req.body ?? {}) as { ids?: string[] }
  if (!Array.isArray(ids) || ids.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: 'ids must be a non-empty array' })
  }

  try {
    const payments = (await Payment.find({ _id: { $in: ids } })) as any[]

    let allowedDomainIds: Set<string> | null = null
    if (!isGlobalAdmin) {
      const domains = await Domain.find({
        adminEmails: { $in: [user.email] },
      })
      allowedDomainIds = new Set(domains.map((d: any) => d._id.toString()))
    }

    const updatedIds: string[] = []
    const skippedIds: string[] = []

    for (const payment of payments) {
      if (payment.type === Operations.Credit) {
        skippedIds.push(payment._id.toString())
        continue
      }
      if (
        allowedDomainIds &&
        !allowedDomainIds.has(payment.domain.toString())
      ) {
        skippedIds.push(payment._id.toString())
        continue
      }

      const updated = await Payment.findOneAndUpdate(
        { _id: payment._id },
        {
          $set: {
            type: Operations.Credit,
            invoiceCreationDate: dateShiftMs(payment.invoiceCreationDate, 1),
          },
        },
        { new: true }
      )

      if (!updated) {
        skippedIds.push(payment._id.toString())
        continue
      }

      await PaymentChangeLog.create({
        paymentId: payment._id,
        date: new Date(),
        reason: 'mark-paid',
        actorId: user?._id,
        actorEmail: user?.email,
        invoiceData: {
          invoiceNumber: payment.invoiceNumber,
          invoiceCreationDate: payment.invoiceCreationDate,
          invoice: payment.invoice,
          provider: payment.provider,
          reciever: payment.reciever,
          generalSum: payment.generalSum,
          description: payment.description,
          type: payment.type,
          template: payment.template,
        },
      })

      if (isGlobalAdmin) {
        await ProfitService.updatePayment(updated._id.toString(), {
          type: updated.type as 'debit' | 'credit',
          date: updated.invoiceCreationDate,
          amount: updated.generalSum,
          description:
            updated.type === Operations.Debit
              ? `Інвойс №${updated.invoiceNumber}`
              : updated.description,
          invoiceNumber: String(updated.invoiceNumber),
        })
      }

      updatedIds.push(updated._id.toString())
    }

    const notFoundIds = ids.filter(
      (id) => !payments.some((p) => p._id.toString() === id)
    )

    return res.status(200).json({
      success: true,
      data: {
        updatedIds,
        skippedIds: [...skippedIds, ...notFoundIds],
        totalRequested: ids.length,
      },
    })
  } catch (error: any) {
    return res
      .status(400)
      .json({ success: false, message: error?.message ?? 'unknown error' })
  }
}
