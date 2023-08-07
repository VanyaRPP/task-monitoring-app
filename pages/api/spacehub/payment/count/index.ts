/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { NextApiResponse } from 'next'
import Payment from 'common/modules/models/Payment'
import start, { Data } from '@pages/api/api.config'
start()

export default async function handler(_, res: NextApiResponse<Data>) {
  try {
    await Payment.countDocuments().then((count) => {
      return res.status(200).json({
        success: true,
        data: count,
      })
    })
  } catch (error) {
    return res.status(400).json({ success: false, error: error })
  }
}
