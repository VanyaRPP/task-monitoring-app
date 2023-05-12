/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import { authOptions } from '@pages/api/auth/[...nextauth]'
import start, { Data } from 'pages/api/api.config'
import User from '@common/modules/models/User'
import { getServerSession } from 'next-auth'
import { Roles } from '@utils/constants'
import Street from '@common/modules/models/Street'
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
    case 'DELETE':
      try {
        await Street.findByIdAndRemove(req.query.id).then((street) => {
          if (street) {
            return res.status(200).json({
              success: true,
              data: 'Street ' + req.query.id + ' was deleted',
            })
          } else {
            return res.status(400).json({
              success: false,
              data: 'Street ' + req.query.id + ' was not found',
            })
          }
        })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
  }
}
