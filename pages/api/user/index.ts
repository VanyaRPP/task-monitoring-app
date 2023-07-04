import type { NextApiRequest, NextApiResponse } from 'next'
import User from 'common/modules/models/User'
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
        const { isAdmin } = await getCurrentUser(req, res)
        if (isAdmin) {
          const users = await User.find({})
          return res.status(200).json({ success: true, data: users })
        }
      } catch (error) {
        return res.status(400).json({ success: false })
      }
  }
}
