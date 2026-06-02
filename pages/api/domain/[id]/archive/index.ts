/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import Domain from '@modules/models/Domain'
import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { isGlobalAdmin, isDomainAdmin, isAdmin, user } = await getCurrentUser(
    req,
    res
  )

  if (req.method !== 'PATCH') {
    return res
      .status(405)
      .json({ success: false, message: 'Method not allowed' })
  }

  try {
    if (!isAdmin) {
      return res.status(400).json({ success: false, message: 'not allowed' })
    }

    if (isDomainAdmin && !isGlobalAdmin) {
      const domain = await Domain.findOne({
        _id: req.query.id,
        adminEmails: user.email,
      })
      if (!domain) {
        return res.status(403).json({
          success: false,
          message:
            'Access denied: domain not found or you are not an admin of this domain',
        })
      }
    }

    const response = await Domain.findOneAndUpdate(
      { _id: req.query.id },
      { archived: !!req.body.archived },
      { new: true }
    )
    return res.status(200).json({ success: true, data: response })
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message })
  }
}
