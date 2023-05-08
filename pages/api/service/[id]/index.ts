/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import { authOptions } from '@pages/api/auth/[...nextauth]'
import Service from '@common/modules/models/Service'
import start, { Data } from 'pages/api/api.config'
import User from '@common/modules/models/User'
import { getServerSession } from 'next-auth'
import { Roles } from '@utils/constants'
start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const session = await getServerSession(req, res, authOptions)
  const user = await User.findOne({ email: session?.user?.email })
  const isAdmin = user?.role === Roles.ADMIN

  if (!user || !isAdmin) {
    return res.status(400).json({ success: false, message: 'not allowed' })
  }

  switch (req.method) {
    case 'DELETE':
      try {
        await Service.findByIdAndRemove(req.query.id).then((service) => {
          if (service) {
            return res.status(200).json({
              success: true,
              data: 'Service ' + req.query.id + ' was deleted',
            })
          } else {
            return res.status(400).json({
              success: false,
              data: 'Service ' + req.query.id + ' was not found',
            })
          }
        })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
  }
}
