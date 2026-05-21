import User from '@modules/models/User'
import Domain from '@modules/models/Domain'
import start from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'
import { Roles } from '@utils/constants'
import { isDev } from '@utils/env'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    user: currentUser,
    isGlobalAdmin,
    isDomainAdmin,
  } = await getCurrentUser(req, res)

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
        const targetId = req.query.id?.toString()
        const currentId = currentUser?._id?.toString()
        const isSelf = Boolean(targetId && currentId && targetId === currentId)

        const isRoleUpdate = 'roles' in req.body || 'role' in req.body

        if (!isSelf && !isGlobalAdmin) {
          return res
            .status(403)
            .json({ success: false, message: 'not allowed' })
        }

        if (!isDev && isRoleUpdate && !isGlobalAdmin) {
          return res.status(403).json({
            success: false,
            message: "sorry, u can't change roles",
          })
        }

        if (isSelf && isRoleUpdate && !isGlobalAdmin) {
          return res
            .status(403)
            .json({ success: false, message: 'not allowed' })
        }
        if (isSelf && isRoleUpdate && isGlobalAdmin) {
          const nextRoles =
            req.body.roles ?? (req.body.role ? [req.body.role] : [])
          const willLoseGlobal =
            Array.isArray(nextRoles) && !nextRoles.includes(Roles.GLOBAL_ADMIN)

          if (willLoseGlobal) {
            return res.status(403).json({
              success: false,
              message: "You can't remove GLOBAL_ADMIN from yourself",
            })
          }
        }

        const updatedUser = await User.updateOne({ _id: targetId }, req.body)

        return res.status(200).json({
          data: updatedUser,
          success: true,
        })
      } catch (error: any) {
        return res.status(400).json({ success: false, message: error?.message })
      }

    case 'DELETE':
      try {
        if (!isGlobalAdmin && !isDomainAdmin) {
          return res
            .status(403)
            .json({ success: false, message: 'not allowed' })
        }

        const targetId = req.query.id?.toString()
        const currentId = currentUser?._id?.toString()

        if (targetId === currentId) {
          return res
            .status(403)
            .json({ success: false, message: "You can't delete yourself" })
        }

        if (isDomainAdmin && !isGlobalAdmin) {
          const targetUser = await User.findById(targetId)
          if (!targetUser) {
            return res
              .status(404)
              .json({ success: false, message: 'User not found' })
          }

          const adminDomains = await Domain.find({
            adminEmails: currentUser.email,
          })
          const domainEmails = adminDomains.flatMap(
            (d) => d.adminEmails as string[]
          )

          if (!domainEmails.includes(targetUser.email)) {
            return res
              .status(403)
              .json({ success: false, message: 'User is not in your domain' })
          }
        }

        await User.findByIdAndDelete(targetId)

        return res.status(200).json({ success: true })
      } catch (error: any) {
        return res.status(400).json({ success: false, message: error?.message })
      }
  }
}
