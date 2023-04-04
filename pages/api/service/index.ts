/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import start, { Data } from 'pages/api/api.config'
import Service from '@common/modules/models/Service'
import { getServerSession } from 'next-auth'
import { authOptions } from '@pages/api/auth/[...nextauth]'
import User from '@common/modules/models/User'
import { Roles } from '@utils/constants'

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
        const isAdmin = user?.role === Roles.ADMIN

        const services = await Service.find(
          isAdmin ? { email: req.query.email } : { email: session.user.email }
        )
          .sort({ date: -1 })
          .limit(req.query.limit)

        return res.status(200).json({
          success: true,
          data: services,
        })
      } catch (error) {
        return res.status(400).json({ success: false })
      }
    case 'POST':
      try {
        const service = await Service.create(req.body)
        return res.status(200).json({ success: true, data: service })
      } catch (error) {
        return res.status(400).json({ success: false })
      }
  }
}
