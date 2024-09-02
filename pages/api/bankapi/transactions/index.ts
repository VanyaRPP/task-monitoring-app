/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import start, { Data } from '@pages/api/api.config'
import { getFinalTransactions } from './utils/getTransactions/index'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { token: tokenQuery } = req.query
  const { token: tokenHeader } = req.headers

  if (!tokenQuery && !tokenHeader) {
    return res
      .status(404)
      .json({ success: false, message: 'Error! No bank token!' })
  }

  switch (req.method) {
    case 'GET':
      try {
        getFinalTransactions(tokenHeader ?? tokenQuery)
          .then((rez) => {
            return res.status(200).json({ success: true, data: rez })
          })
          .catch((rez) => {
            return res.status(409).json({ success: false, message: rez })
          })
      } catch (error) {
        return res.status(400).json({ success: false, message: error })
      }
      break

    case 'POST':
      return res
        .status(501)
        .json({ success: false, message: 'not implemented' })

    case 'PATCH':
      return res
        .status(501)
        .json({ success: false, message: 'not implemented' })

    case 'DELETE':
      return res
        .status(501)
        .json({ success: false, message: 'not implemented' })
  }
}
