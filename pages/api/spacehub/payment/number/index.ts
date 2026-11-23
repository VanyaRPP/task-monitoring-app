import start, { Data } from '@pages/api/api.config'
import { getNextInvoiceNumber } from '@common/services/paymentService/payment.service'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  await start()

  try {
    const next = await getNextInvoiceNumber()
    return res.status(200).json({ success: true, data: next })
  } catch (error: any) {
    return res
      .status(400)
      .json({ success: false, error: error?.message ?? 'unknown error' })
  }
}
