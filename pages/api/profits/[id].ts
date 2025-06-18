import ProfitService from '@common/services/profitService/profit.service'
import { NextApiRequest, NextApiResponse } from 'next'
import { getCurrentUser } from '@utils/getCurrentUser'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { isGlobalAdmin } = await getCurrentUser(req, res)
  if (!isGlobalAdmin) return res.status(403).json({ success: false })

  const { id } = req.query

  try {
    switch (req.method) {
      case 'GET': {
        const record = await ProfitService.getById(id as string)
        return res.status(200).json({ success: true, data: record })
      }

      case 'PATCH': {
        const updated = await ProfitService.update(id as string, req.body)
        return res.status(200).json({ success: true, data: updated })
      }

      case 'DELETE': {
        await ProfitService.delete(id as string)
        return res.status(200).json({ success: true })
      }

      default:
        return res.status(405).end()
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
