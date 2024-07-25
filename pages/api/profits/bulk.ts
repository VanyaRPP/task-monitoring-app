import ProfitService from '@common/services/profitService/profit.service'
import { NextApiRequest, NextApiResponse } from 'next'
import { getCurrentUser } from '@utils/getCurrentUser'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { isGlobalAdmin } = await getCurrentUser(req, res)
  if (!isGlobalAdmin) return res.status(403).json({ success: false })

  try {
    switch (req.method) {
      case 'POST': {
        const records = req.body
        if (!Array.isArray(records)) {
          return res
            .status(400)
            .json({ success: false, message: 'Expected array of records' })
        }
        const created = await ProfitService.bulkCreate(records)
        return res.status(200).json({ success: true, data: created })
      }

      default:
        return res.status(405).end()
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
