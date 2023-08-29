/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { NextApiResponse } from 'next'
import Payment from 'common/modules/models/Payment'
import start, { Data } from '@pages/api/api.config'
import { getMaxInvoiceNumber } from '../pipelines'
start()

export default async function handler(_, res: NextApiResponse<Data>) {
  try {
    const maxInvoiceNumberPipeline = getMaxInvoiceNumber()
    const maxInvoiceNumber = await Payment.aggregate(maxInvoiceNumberPipeline)
    await Payment.countDocuments().then((count) => {
      return res.status(200).json({
        success: true,
        data: {
          count,
          maxInvoiceNumber: maxInvoiceNumber[0]?.maxNumber || 0,
        },
      })
    })
  } catch (error) {
    return res.status(400).json({ success: false, error: error })
  }
}
