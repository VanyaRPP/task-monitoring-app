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

  try {
    const { isDomainAdmin, isGlobalAdmin, user } = await getCurrentUser(
      req,
      res
    )

    if (!isDomainAdmin && !isGlobalAdmin) {
      return res.status(403).json({ success: false, message: 'not allowed' })
    }

    const current = await Payment.findById(req.query.id)
    if (!current) {
      return res
        .status(404)
        .json({ success: false, message: 'Payment not found' })
    }

    if (current.type === Operations.Credit) {
      return res.status(200).json({
        success: true,
        data: current,
        message: 'already-paid',
      })
    }

    if (isDomainAdmin && !isGlobalAdmin) {
      const domain = await Domain.findOne({
        _id: current.domain,
        adminEmails: { $in: [user.email] },
      })
      if (!domain) {
        return res.status(403).json({ success: false, message: 'not allowed' })
      }
    }

    const updated = await Payment.findOneAndUpdate(
      { _id: current._id },
      {
        $set: {
          type: Operations.Credit,
          invoiceCreationDate: dateShiftMs(current.invoiceCreationDate, 1),
        },
      },
      { new: true }
    )

    if (!updated) {
      return res
        .status(500)
        .json({ success: false, message: 'failed to update payment' })
    }

    await PaymentChangeLog.create({
      paymentId: current._id,
      date: new Date(),
      reason: 'mark-paid',
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
        updated.type === Operations.Debit
          ? `Інвойс №${updated.invoiceNumber}`
          : updated.description

      await ProfitService.updatePayment(updated._id.toString(), {
        type: updated.type as 'debit' | 'credit',
        date: updated.invoiceCreationDate,
        amount: updated.generalSum,
        description,
        invoiceNumber: String(updated.invoiceNumber),
      })
    }

    return res.status(200).json({ success: true, data: updated })
  } catch (error: any) {
    return res
      .status(400)
      .json({ success: false, message: error?.message ?? 'unknown error' })
  }
}
