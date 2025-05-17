import FeatureFlag from '@modules/models/FeatureFlag'
import { getCurrentUser } from '@utils/getCurrentUser'

export default async function handler(req, res) {
  const { isGlobalAdmin } = await getCurrentUser(req, res)
  if (!isGlobalAdmin) return res.status(403).json({ success: false })

  if (req.method === 'PATCH') {
    const flag = await FeatureFlag.findByIdAndUpdate(req.query.id, req.body, { new: true })
    return res.status(200).json({ success: true, data: flag })
  }
  if (req.method === 'DELETE') {
    try {
      await FeatureFlag.findByIdAndDelete(req.query.id)
      return res.status(200).json({
        succcess: true })
    } catch (error) {
      return res.status(500).json({
        success:false, error: error.message })
    }
  } 
  return res.status(405).end()

}
