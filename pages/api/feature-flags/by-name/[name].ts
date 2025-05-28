import FeatureFlagService from '@modules/services/FeatureFlagServices'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  
  if (req.method !== 'GET') {
    return res
      .status(405)
      .json({ success: false, message: 'Method Not Allowed' })
  }

  try {
    const flag = await FeatureFlagService.getByName(req.query.name as string )
    if (!flag) {
      return res
        .status(404)
        .json({ success: false, message: 'Feature flag not found' })
    }

    return res.status(200).json({ success: true, data: flag })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
