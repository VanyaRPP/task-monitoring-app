import Payment from '@common/modules/models/Payment'
import Domain from '@modules/models/Domain'
import ProfitService from '@common/services/profitService/profit.service'
import start, { Data } from '@pages/api/api.config'
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
  if (req.method !== 'DELETE') {
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
  const { isDomainAdmin, isGlobalAdmin, user } = perms

  if (!isDomainAdmin && !isGlobalAdmin) {
    return res.status(403).json({ success: false, message: 'not allowed' })
  }

  const ids = (req.body ?? {}).ids
  if (!isNonEmptyStringArray(ids)) {
    return res.status(400).json({
      success: false,
      message: 'ids must be a non-empty array of strings',
    })
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

    const allowedIds = payments
      .filter((p) => {
        if (!allowedDomainIds) return true
        const domainId = p.domain ? p.domain.toString() : null
        return !!domainId && allowedDomainIds.has(domainId)
      })
      .map((p) => p._id.toString())

    let deletedIds: string[] = []
    if (allowedIds.length > 0) {
      const result = await Payment.deleteMany({ _id: { $in: allowedIds } })
      const deletedCount = result?.deletedCount ?? 0

      if (deletedCount === allowedIds.length) {
        deletedIds = allowedIds
      } else if (deletedCount > 0) {
        // Race with concurrent deletion: re-query to find which are still here
        // and report only the ones that actually disappeared during our call.
        const stillThere = (await Payment.find({
          _id: { $in: allowedIds },
        }).select('_id')) as Array<{ _id: { toString(): string } }>
        const stillThereIds = new Set(stillThere.map((p) => p._id.toString()))
        deletedIds = allowedIds.filter((id) => !stillThereIds.has(id))
      }

      if (isGlobalAdmin && deletedIds.length > 0) {
        const settled = await Promise.allSettled(
          deletedIds.map((id) => ProfitService.deleteByIdPayment(id))
        )
        for (const r of settled) {
          if (r.status === 'rejected') {
            // eslint-disable-next-line no-console
            console.error(
              '[bulk-delete] ProfitService.deleteByIdPayment failed:',
              r.reason
            )
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      data: { deletedIds },
    })
  } catch (error: any) {
    return res
      .status(500)
      .json({ success: false, message: error?.message ?? 'unknown error' })
  }
}
