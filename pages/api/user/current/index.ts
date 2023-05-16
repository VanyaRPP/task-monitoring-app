/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import start, { Data } from 'pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  switch (req.method) {
    case 'GET':
      try {
        const { user } = await getCurrentUser(req, res)
        return res.status(200).json({ success: true, data: user })
      } catch (error) {
        return res.status(400).json({ success: false })
      }
  }
}
