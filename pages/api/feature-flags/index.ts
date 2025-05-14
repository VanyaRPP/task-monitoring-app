import FeatureFlags from '@modules/models/FeatureFlag'
import { getCurrentUser } from '@utils/getCurrentUser'

export default async function handler(req, res) {
  const {isGlobalAdmin} = await getCurrentUser(req, res)
  if (!isGlobalAdmin) return res.status(403).json({ success: false})

   if (req.method === 'GET') {
    const flags = await FeatureFlags.find()
    return res.status(200).json({ success: true, data: flags})
   }

   return res.status(405).end()
}