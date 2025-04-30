import User from '@modules/models/User'
import start from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { user: currentUser } = await getCurrentUser(req, res)

  switch (req.method) {
    case 'GET':
      try {
        const user = await User.findById(req.query.id)

        return res.status(200).json({ success: true, data: user })
      } catch (error) {
        return res.status(400).json({ success: false })
      }
      case 'PATCH':
        try {
          const targetUserId = req.query.id?.toString()
          const isSelf = currentUser?._id?.toString() === targetUserId
          const isGlobalAdmin = currentUser?.roles?.includes('GlobalAdmin')
          const isDevEnv = process.env.NODE_ENV === 'development'

          if (!isSelf && !isGlobalAdmin && !isDevEnv) {
            return res.status(403).json({ success: false, message: 'Forbidden' })
          }

          if ('roles' in req.body && !isDevEnv && !isGlobalAdmin) {
            return res.status(400).json({ success: false, message: 'Cannot change roles' })
          }

          if (
            !isSelf &&
            req.body.roles?.includes('GlobalAdmin') &&
            !isDevEnv
          ) {
            return res.status(400).json({ success: false, message: 'Cannot assign GlobalAdmin role' })
          }

          const updatedUser = await User.updateOne({ _id: targetUserId }, req.body)
          return res.status(200).json({ data: updatedUser, success: true })
        } catch (error) {
          return res.status(400).json({ success: false })
        }
    // try {
    //   const user = await User.updateOne(
    //     { _id: req.query.id },
    //     {
    //       ...req.body,
    //     }
    //   )
    //   return res.status(200).json({
    //     data: { email: user.email, name: user.name, image: user.image },
    //     success: true,
    //   })
    // } catch (error) {
    //   return res.status(400).json({ success: false })
    // }
  }
}
