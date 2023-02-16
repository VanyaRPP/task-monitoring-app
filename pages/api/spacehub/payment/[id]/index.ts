/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import Payment from 'common/modules/models/Payment'
import start, { Data } from 'pages/api/api.config'
start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  switch (req.method) {
    case 'DELETE':
      try {
        await Payment.findByIdAndRemove(req.query.id).then((payment) => {
          if (!payment) {
            return res.status(400).json({
              success: false,
              data: 'Payment ' + req.query.id + ' was not found',
            })
          } else {
            return res.status(200).json({
              success: true,
              data: 'Payment ' + req.query.id + ' was deleted',
            })
          }
        })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
  }
}
