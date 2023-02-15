/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { Payment, postValidateBody } from '@common/modules/models/Payment'
import type { NextApiRequest, NextApiResponse } from 'next'
import start, { Data } from 'pages/api/api.config'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  switch (req.method) {
    case 'GET':
      try {
        const payments = await Payment.find({})
        return res.status(200).json({ success: true, data: payments })
      } catch (error) {
        return res.status(400).json({ success: false })
      }
    case 'POST':
      try {
        await postValidateBody(req, res)
        const payments = await Payment.find({})
        return res.status(200).json({ success: true, data: payments })
      } catch (error) {
        const errors = postValidateBody(req)
        return res.status(400).json({ errors: errors.array() })
      }
  }
}
