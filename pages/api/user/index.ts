import User from '@modules/models/User'
import Domain from '@modules/models/Domain'
import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  await start()

  switch (req.method) {
    case 'GET':
      try {
        const { isDomainAdmin, isGlobalAdmin, user } = await getCurrentUser(
          req,
          res
        )

        if (!user) {
          return res
            .status(401)
            .json({ success: false, message: 'Unauthorized' })
        }

        if (isGlobalAdmin) {
          const users = await User.find({})

          return res.status(200).json({
            success: true,
            data: users,
          })
        }

        if (isDomainAdmin) {
          const domains = await Domain.find({
            adminEmails: user.email,
          }).lean()

          const adminEmails = [
            ...new Set(domains.flatMap((domain) => domain.adminEmails)),
          ]

          const users = await User.find({
            email: { $in: adminEmails },
          })

          return res.status(200).json({
            success: true,
            data: users,
          })
        }

        return res
          .status(403)
          .json({ success: false, message: 'Access denied' })
      } catch (error) {
        return res
          .status(400)
          .json({
            success: false,
            message: 'An error occurred while fetching users',
          })
      }

    default:
      return res
        .status(405)
        .json({ success: false, message: 'Method not allowed' })
  }
}
