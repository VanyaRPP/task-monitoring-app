import type { NextApiRequest, NextApiResponse } from 'next'
import start, { Data } from '@pages/api/api.config'
import User from 'common/modules/models/User'
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
          const user = await User.findOne({ email: req.query.email })
          return res.status(200).json({
            success: true,
            data: { email: user.email, name: user.name, image: user.image },
          })
        }
      } catch (error) {
        return res.status(400).json({ success: false })
      }
    case 'PATCH':
      return res.status(400).json({ success: false })
  }
}
