import start, { Data } from '@pages/api/api.config'
import { duplicatePayments } from '@common/services/paymentService/payment.service'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'

start()

const isNonEmptyStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every((v) => typeof v === 'string' && v.length > 0)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
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
  const { isDomainAdmin, isGlobalAdmin, user } = perms

  if (!isDomainAdmin && !isGlobalAdmin) {
    return res.status(403).json({ success: false, message: 'not allowed' })
  }

  const { ids } = (req.body ?? {}) as { ids?: unknown }
  if (!isNonEmptyStringArray(ids)) {
    return res.status(400).json({
      success: false,
      message: 'ids must be a non-empty array of strings',
    })
  }

  try {
    const result = await duplicatePayments(ids, {
      isGlobalAdmin,
      isDomainAdmin,
      user,
    })
    return res.status(200).json({ success: true, data: result })
  } catch (error: any) {
    return res
      .status(400)
      .json({ success: false, message: error?.message ?? 'unknown error' })
  }
}
