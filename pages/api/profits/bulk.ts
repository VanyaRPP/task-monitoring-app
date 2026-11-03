import ProfitService from '@common/services/profitService/profit.service'
import { NextApiRequest, NextApiResponse } from 'next'
import { getCurrentUser } from '@utils/getCurrentUser'
import { parseProfitBody } from '@common/services/profitService/profitInput'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { isGlobalAdmin, user } = await getCurrentUser(req, res)
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
        // Each record is checked like a single POST, and nothing is written
        // unless all of them pass.
        const inputs = []
        for (const [index, record] of records.entries()) {
          const { error, input } = parseProfitBody(record)
          if (error) {
            return res
              .status(400)
              .json({ success: false, message: `records[${index}]: ${error}` })
          }
          inputs.push({ ...input, createdBy: user._id.toString() })
        }
        const created = await ProfitService.bulkCreate(inputs)
        return res.status(200).json({ success: true, data: created })
      }

      default:
        return res.status(405).end()
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
