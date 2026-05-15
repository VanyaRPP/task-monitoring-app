import type { NextApiRequest, NextApiResponse } from 'next'
import mongoose, { Mongoose } from 'mongoose'
import dbConnect from '@utils/dbConnect'
import PaymentChangeLog from '@common/modules/models/PaymentChangeLog'
import Payment from '@common/modules/models/Payment'

type ApiResponse =
  | { success: true; data: any }
  | { success: false; message: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  await dbConnect()

  const paymentId = req.query.id as string

  if (!mongoose.Types.ObjectId.isValid(paymentId)) {
    return res
      .status(400)
      .json({ success: false, message: 'Invalid payment id' })
  }

  if (req.method === 'GET') {
    const logs = await PaymentChangeLog.find({ paymentId })
      .sort({ date: -1 })
      .lean()

    return res.status(200).json({ success: true, data: logs })
  }

  if (req.method === 'POST') {
    const { invoiceData, reason } = req.body ?? {}

    if (!invoiceData) {
      return res
        .status(400)
        .json({ success: false, message: 'invoiceData is required' })
    }

    const exists = await Payment.exists({ _id: paymentId })
    if (!exists) {
      return res
        .status(404)
        .json({ success: false, message: 'Payment not found' })
    }

    const log = await PaymentChangeLog.create({
      paymentId,
      invoiceData,
      reason: reason ?? 'manual',
      actorId: (req as any).user?._id,
      actorEmail: (req as any).user?.email,
    })

    return res.status(201).json({ success: true, data: log })
  }

  if (req.method === 'DELETE') {
    const changeLogId = req.query.changeLogId as string

    if (
      !mongoose.Types.ObjectId.isValid(paymentId) ||
      !mongoose.Types.ObjectId.isValid(changeLogId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ids',
      })
    }

    const deleted = await PaymentChangeLog.findOneAndDelete({
      _id: changeLogId,
      paymentId,
    })

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'ChangeLog not found',
      })
    }

    return res.status(200).json({
      success: true,
      data: deleted,
    })
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' })
}
