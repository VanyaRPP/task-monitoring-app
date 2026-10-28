import type { NextApiRequest, NextApiResponse } from 'next'
import mongoose, { Mongoose } from 'mongoose'
import dbConnect from '@utils/dbConnect'
import PaymentChangeLog from '@common/modules/models/PaymentChangeLog'
import Payment from '@common/modules/models/Payment'
import { getCurrentUser } from '@utils/getCurrentUser'
import {
  canReadPayment,
  canWritePayment,
} from '@common/services/paymentService/paymentAccess'

type ApiResponse =
  { success: true; data: any } | { success: false; message: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  await dbConnect()

  if (!['GET', 'POST', 'DELETE'].includes(req.method ?? '')) {
    return res
      .status(405)
      .json({ success: false, message: 'Method not allowed' })
  }

  let perms: Awaited<ReturnType<typeof getCurrentUser>>
  try {
    perms = await getCurrentUser(req, res)
  } catch {
    return res.status(401).json({ success: false, message: 'unauthorized' })
  }
  const access = { isGlobalAdmin: perms.isGlobalAdmin, user: perms.user }

  const paymentId = req.query.id as string

  if (!mongoose.Types.ObjectId.isValid(paymentId)) {
    return res
      .status(400)
      .json({ success: false, message: 'Invalid payment id' })
  }

  // A change log holds full copies of the invoice, so it follows the
  // payment's own access: whoever may see the payment may read its history;
  // only an admin of its domain may add to or remove from it. A payment the
  // caller can't reach answers 403 whether or not it exists.
  const payment = await Payment.findById(paymentId)
    .select('domain company')
    .lean()
  const allowed =
    !!payment &&
    (req.method === 'GET'
      ? await canReadPayment(payment, access)
      : await canWritePayment(payment, access))
  if (!allowed) {
    return res.status(403).json({ success: false, message: 'not allowed' })
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

    const log = await PaymentChangeLog.create({
      paymentId,
      invoiceData,
      actionType: 'UPDATE',
      source: 'single',
      reason: reason ?? 'manual',
      // From the session - `req.user` was never set, so logs had no author.
      actorId: perms.user._id,
      actorEmail: perms.user.email,
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
