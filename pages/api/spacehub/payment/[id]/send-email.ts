import Payment from '@common/modules/models/Payment'
import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'
import { sendInvoiceEmail } from '@utils/email/sendInvoiceEmail'

export const config = {
  maxDuration: 60,
  api: {
    bodyParser: { sizeLimit: '8mb' },
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  await start()

  let perms: Awaited<ReturnType<typeof getCurrentUser>>
  try {
    perms = await getCurrentUser(req, res)
  } catch (error: any) {
    return res
      .status(401)
      .json({ success: false, message: error?.message ?? 'unauthorized' })
  }

  const { isDomainAdmin, isUser, isGlobalAdmin, user } = perms

  if (req.method !== 'POST')
    return res
      .status(405)
      .json({ success: false, message: 'Method not allowed' })

  try {
    if (!req.query.id)
      return res
        .status(400)
        .json({ success: false, message: "'id' is not provided" })

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
      //* allowed
    } else if (
      isDomainAdmin &&
      payment.domain?.adminEmails?.includes(user.email)
    ) {
      //* allowed
    } else if (isUser && payment.company?.adminEmails?.includes(user.email)) {
      //* allowed
    } else {
      return res.status(403).json({ success: false, message: 'not allowed' })
    }

    // Mirror createPayment: when the stored receiver has no recipients (e.g.
    // legacy payments saved before receiver was populated), fall back to the
    // payment's domain admins instead of silently sending to nobody.
    const currentReceiver = payment.reciever || {}
    const reciever = {
      companyName:
        currentReceiver.companyName || payment.domain?.name || 'invoice',
      adminEmails: currentReceiver.adminEmails?.length
        ? currentReceiver.adminEmails
        : payment.domain?.adminEmails || [],
      description:
        currentReceiver.description || payment.domain?.description || '',
    }

    const html = req.body?.html
    if (html !== undefined && typeof html !== 'string') {
      return res
        .status(400)
        .json({ success: false, message: "'html' must be a string" })
    }

    const result = await sendInvoiceEmail(
      {
        invoiceNumber: payment.invoiceNumber,
        invoiceCreationDate: payment.invoiceCreationDate,
        invoice: payment.invoice,
        provider: payment.provider,
        reciever,
        generalSum: payment.generalSum,
        type: payment.type,
        company: payment.company,
      },
      { html: html || undefined }
    )

    if (!result)
      return res
        .status(400)
        .json({ success: false, message: 'failed to send email' })

    return res.status(200).json({ success: true, data: { sent: true } })
  } catch (error: any) {
    return res
      .status(400)
      .json({ success: false, error: error?.message ?? 'unknown error' })
  }
}
