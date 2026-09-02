import mongoose from 'mongoose'
import type { NextApiRequest, NextApiResponse } from 'next'
import start from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import PaymentChangeLog from '@common/modules/models/PaymentChangeLog'
import Payment from '@common/modules/models/Payment'
import Domain from '@modules/models/Domain'
import { logPaymentMutation } from '@common/modules/services/paymentAudit'

const DELETE_ACTIONS = ['DELETE', 'BULK_DELETE']
const RESTORABLE_ACTIONS = ['DELETE', 'BULK_DELETE', 'UPDATE']

const firstString = (value?: string | string[]): string | undefined =>
  Array.isArray(value) ? value[0] : value

const domainIdOf = (domain: any): string | null => {
  if (!domain) return null
  if (typeof domain === 'object' && domain._id) return domain._id.toString()
  return domain.toString()
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await start()

  if (req.method !== 'POST') {
    return res
      .status(405)
      .json({ success: false, message: 'Method not allowed' })
  }

  let perms: Awaited<ReturnType<typeof getCurrentUser>>
  try {
    perms = await getCurrentUser(req, res)
  } catch (error: any) {
    return res
      .status(401)
      .json({ success: false, message: error?.message ?? 'unauthorized' })
  }
  const { isGlobalAdmin, isDomainAdmin, user } = perms

  if (!isGlobalAdmin && !isDomainAdmin) {
    return res.status(403).json({ success: false, message: 'not allowed' })
  }

  const logId = firstString(req.query.logId)
  if (!logId || !mongoose.Types.ObjectId.isValid(logId)) {
    return res.status(400).json({ success: false, message: 'Invalid log id' })
  }

  const log: any = await PaymentChangeLog.findById(logId).lean()
  if (!log) {
    return res
      .status(404)
      .json({ success: false, message: 'Audit log not found' })
  }

  if (!RESTORABLE_ACTIONS.includes(log.actionType)) {
    return res.status(400).json({
      success: false,
      message: 'Only DELETE / BULK_DELETE / UPDATE entries can be restored',
    })
  }

  const before = log.before
  if (!before || !before._id) {
    return res.status(400).json({
      success: false,
      message: 'Audit log has no snapshot to restore',
    })
  }

  if (!isGlobalAdmin) {
    const ownedDomains = await Domain.find({ adminEmails: user.email }).select(
      '_id'
    )
    const ownedIds = new Set(ownedDomains.map((d: any) => d._id.toString()))
    const beforeDomainId = domainIdOf(before.domain)
    if (!beforeDomainId || !ownedIds.has(beforeDomainId)) {
      return res.status(403).json({ success: false, message: 'not allowed' })
    }
  }

  const { _id, __v, ...beforeFields } = before

  try {
    if (DELETE_ACTIONS.includes(log.actionType)) {
      const alreadyExists = await Payment.exists({ _id: before._id })
      if (alreadyExists) {
        return res
          .status(409)
          .json({ success: false, message: 'Payment already exists' })
      }

      const restored: any = await Payment.create({
        ...beforeFields,
        _id: before._id,
      } as any)

      await logPaymentMutation({
        actionType: 'RESTORE',
        source: 'admin-restore',
        actor: user,
        after: restored,
      })

      return res.status(201).json({ success: true, data: restored })
    }

    const current: any = await Payment.findById(before._id)

    const reverted: any = current
      ? await Payment.findByIdAndUpdate(before._id, beforeFields, { new: true })
      : await Payment.create({ ...beforeFields, _id: before._id } as any)

    await logPaymentMutation({
      actionType: 'RESTORE',
      source: 'admin-restore',
      actor: user,
      reason: 'restore-invoice',
      before: current ?? undefined,
      after: reverted,
    })

    return res.status(200).json({ success: true, data: reverted })
  } catch (error: any) {
    return res
      .status(500)
      .json({ success: false, message: error?.message ?? 'unknown error' })
  }
}
