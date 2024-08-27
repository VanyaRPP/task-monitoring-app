import User from '@modules/models/User'
import start from '@pages/api/api.config'
import { Roles } from '@utils/constants'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'


start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {user: currentUser, isGlobalAdmin} = await getCurrentUser(req, res)

  switch (req.method) {
    case 'GET':
      try {
        const user = await User.findById(req.query.id)

        return res
          .status(200)
          .json({ success: true, data: user })
      } catch (error) {
        return res.status(400).json({ success: false })
      }
    case 'PATCH':
      try {
        if (req.query.id !== currentUser?._id.toString() && !isGlobalAdmin) {
          return res
            .status(400)
            .json({ success: false, message: 'not allowed' })
        }

        if (process.env.NODE_ENV !== 'development') {
          return res
            .status(400)
            .json({ success: false, message: 'only for developers' })
        }

        const user = await User.findById(req.query.id)
        if (user.email !== req.body.email) {
          return res.status(400).json({ success: false, message: 'email cannot be changed' })
        }

        if (req.body.roles && !isGlobalAdmin && !user.roles.includes(Roles.GLOBAL_ADMIN)) {
          return res.status(400).json({ success: false, message: 'you can`t change roles' })
        }

        const updatedUser = await User.updateOne(
          { _id: req.query.id },
          req.body
        )

        return res.status(200).json({
          data: updatedUser,
          success: true,
        })
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
