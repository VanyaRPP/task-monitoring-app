/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import start, { Data } from 'pages/api/api.config'
import Payment from 'common/modules/models/Payment'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  switch (req.method) {
    case 'GET':
      try {
        const payments = await Payment.find({})
          .sort({ date: -1 })
          .populate('payer')

        const filteredByEmailPayments = payments.filter((p) => {
          return p?.payer?.email === req.query.email
        })

        return res
          .status(200)
          .json({ success: true, data: filteredByEmailPayments })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
  }
}
