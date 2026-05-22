import type { NextApiRequest, NextApiResponse } from 'next'
import { getCurrentUser } from '@utils/getCurrentUser'
import start, { Data } from '@pages/api/api.config'
import Domain from '@modules/models/Domain'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'GET') {
    return res
      .status(405)
      .json({ success: false, message: 'Method not allowed' })
  }

  try {
    const { isDomainAdmin, isGlobalAdmin, user } = await getCurrentUser(
      req,
      res
    )

    if (!user || !user.email) {
      return res
        .status(400)
        .json({ success: false, message: 'User email is required' })
    }

    if (!isGlobalAdmin && !isDomainAdmin) {
      return res
        .status(403)
        .json({ success: false, message: 'Access denied: not an admin' })
    }
    const archivedFilter = { archived: false }
    const domains = isGlobalAdmin
      ? await Domain.find({ ...archivedFilter }).lean()
      : await Domain.find({ adminEmails: user.email, ...archivedFilter }).lean()

    return res.status(200).json({ success: true, data: domains })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    })
  }
}
