/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import User from 'common/modules/models/User'
import start, { Data } from 'pages/api/api.config'
import { getServerSession } from 'next-auth'
import { authOptions } from '@pages/api/auth/[...nextauth]'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  switch (req.method) {
    case 'GET':
      try {
        const session = await getServerSession(req, res, authOptions)
        const user = await User.findOne({ email: session.user.email })
        return res.status(200).json({ success: true, data: user })
      } catch (error) {
        return res.status(400).json({ success: false })
      }
  }
}
