/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import start, { Data } from '@pages/api/api.config'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  switch (req.method) {
    case 'GET':
      return res
        .status(400)
        .json({ success: false, message: 'not implemented' })

    case 'POST':
      return res
        .status(400)
        .json({ success: false, message: 'not implemented' })

    case 'PATCH':
      return res
        .status(400)
        .json({ success: false, message: 'not implemented' })

    case 'DELETE':
      return res
        .status(400)
        .json({ success: false, message: 'not implemented' })
  }
}
