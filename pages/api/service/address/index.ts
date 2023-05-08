/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import User from 'common/modules/models/User'
import start, { Data } from 'pages/api/api.config'
import { getServerSession } from 'next-auth'
import Service from '@common/modules/models/Service'
import { authOptions } from '@pages/api/auth/[...nextauth]'
import { Roles } from '@utils/constants'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const session = await getServerSession(req, res, authOptions)
  const user = await User.findOne({ email: session?.user?.email })
  const isAdmin = user?.role === Roles.ADMIN

  if (!isAdmin) {
    return res.status(400).json({ success: false, message: 'not allowed' })
  }

  switch (req.method) {
    case 'GET':
      try {
        const addresses = await Service.find({}).distinct('address')
        return res.status(200).json({ success: true, data: addresses })
      } catch (error) {
        return res.status(400).json({ success: false })
      }
  }
}
