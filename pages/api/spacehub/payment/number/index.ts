/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import Payment from '@modules/models/Payment'
import start, { Data } from '@pages/api/api.config'
import type { NextApiResponse } from 'next'
import { getMaxInvoiceNumber } from '../pipelines'
start()

export default async function handler(_, res: NextApiResponse<Data>) {
  try {
    const maxInvoiceNumberPipeline = getMaxInvoiceNumber()
    await Payment.aggregate(maxInvoiceNumberPipeline).then((invoiceNumber) => {
      return res.status(200).json({
        success: true,
        data: invoiceNumber[0]?.maxNumber + 1,
      })
    })
  } catch (error) {
    return res.status(400).json({ success: false, error: error })
  }
}
