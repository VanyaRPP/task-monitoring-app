import FeatureFlagService from '@modules/services/FeatureFlagServices'
import { getCurrentUser } from '@utils/getCurrentUser'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { isGlobalAdmin } = await getCurrentUser(req, res)
  if (!isGlobalAdmin) return res.status(403).json({ success: false })

  try {
    switch (req.method) {
      case 'GET': {
        const flags = await FeatureFlagService.getAll()
        return res.status(200).json({ success: true, data: flags })
      }

      case 'POST': {
        const { name, description, isEnabled } = req.body
        const flag = await FeatureFlagService.create({
          name,
          description,
          isEnabled,
        })
        res.status(200).json({ success: true, data: flag })
      }

      default:
        return res.status(405).end()
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
