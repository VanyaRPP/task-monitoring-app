import FeatureFlags from '@modules/models/FeatureFlag'
import { getCurrentUser } from '@utils/getCurrentUser'

export default async function handler(req, res) {
  const { isGlobalAdmin } = await getCurrentUser(req, res)
  if (!isGlobalAdmin) return res.status(403).json({ success: false })

  switch (req.method) {
    case 'GET':
      try {
        const flags = await FeatureFlags.find()
        return res.status(200).json({ success: true, data: flags })
      } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
      }

    case 'POST':
      try {
        const { name, description, isEnabled } = req.body

        const exists = await FeatureFlags.findOne({ name })
        if (exists) {
          return res.status(400).json({
            success: false,
            message: 'Feature flag with this name already exists',
          })
        }

        const flag = await FeatureFlags.create({ name, description, isEnabled })
        return res.status(201).json({ success: true, data: flag })
      } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
      }

    default:
      return res.status(405).end()
  }
}
