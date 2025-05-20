import FeatureFlags from '@modules/models/FeatureFlag'
import { getCurrentUser } from '@utils/getCurrentUser'

export default async function handler(req, res) {
  const { isGlobalAdmin } = await getCurrentUser(req, res)
  if (!isGlobalAdmin) return res.status(403).json({ success: false })

  const {
    query: { name },
    method,
  } = req

  if (method !== 'GET') {
    return res
      .status(405)
      .json({ success: false, message: 'Method Not Allowed' })
  }

  try {
    const flag = await FeatureFlags.findOne({ name })
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
