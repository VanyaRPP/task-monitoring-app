import Payment from '@common/modules/models/Payment'
import Domain from '@modules/models/Domain'
import start, { Data } from '@pages/api/api.config'
import ProfitService from '@common/services/profitService/profit.service'
import { getNextInvoiceNumber } from '@common/services/paymentService/payment.service'
import { getCurrentUser } from '@utils/getCurrentUser'
import { Operations } from '@utils/constants'
import type { NextApiRequest, NextApiResponse } from 'next'

start()

const COPYABLE_PAYMENT_FIELDS = [
  'type',
  'domain',
  'street',
  'company',
  'monthService',
  'description',
  'invoice',
  'provider',
  'reciever',
  'generalSum',
  'currency',
  'losses',
  'template',
] as const

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

  const { ids } = (req.body ?? {}) as { ids?: string[] }
  if (!Array.isArray(ids) || ids.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: 'ids must be a non-empty array' })
  }

  try {
    const sourcePayments = (await Payment.find({
      _id: { $in: ids },
    })) as any[]

    let allowedDomainIds: Set<string> | null = null
    if (!isGlobalAdmin) {
      const domains = await Domain.find({
        adminEmails: { $in: [user.email] },
      })
      allowedDomainIds = new Set(domains.map((d: any) => d._id.toString()))
    }

    const createdIds: string[] = []
    const skippedIds: string[] = []

    for (const source of sourcePayments) {
      if (allowedDomainIds && !allowedDomainIds.has(source.domain.toString())) {
        skippedIds.push(source._id.toString())
        continue
      }

      const duplicateData: Record<string, any> = {
        invoiceCreationDate: new Date(),
        invoiceNumber: await getNextInvoiceNumber(),
      }
      for (const field of COPYABLE_PAYMENT_FIELDS) {
        if (source[field] !== undefined) {
          duplicateData[field] = source[field]
        }
      }

      const created = (await Payment.create(duplicateData)) as any
      if (!created) {
        skippedIds.push(source._id.toString())
        continue
      }

      try {
        await ProfitService.create({
          domain: created.domain.toString(),
          payment: created._id.toString(),
          amount: created.generalSum,
          type: created.type === Operations.Credit ? 'credit' : 'debit',
          date: created.invoiceCreationDate,
          description:
            created.type === Operations.Debit
              ? `Інвойс №${created.invoiceNumber}`
              : created.description,
          invoiceNumber: String(created.invoiceNumber),
        })
      } catch (profitError: any) {
        console.error('[payment-duplicate] profit_create_failed', {
          paymentId: created._id?.toString?.(),
          message: profitError?.message,
        })
      }

      createdIds.push(created._id.toString())
    }

    const notFoundIds = ids.filter(
      (id) => !sourcePayments.some((p) => p._id.toString() === id)
    )

    return res.status(200).json({
      success: true,
      data: {
        createdIds,
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
