import FeatureFlagService from '@modules/services/FeatureFlagServices'
import { getCurrentUser } from '@utils/getCurrentUser'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  const { isGlobalAdmin } = await getCurrentUser(req, res)
  if (!isGlobalAdmin) return res.status(403).json({ success: false })

    const id = req.query.id as string

    try {
    switch (req.method) {
      case 'PATH': {
        const updated = await FeatureFlagService.update(id,req.body)
        return res.status(200).json({ success: true, data: updated })
      }
      case 'DELETE': {
        await FeatureFlagService.delete(id)
        return res.status(200).json({ success: true})
      }
      
      default: 
        return res.status(405).end()
    }
   } catch (error: any) {
      return res.status(500).json({
        success:false, error: error.message })
    }
}
