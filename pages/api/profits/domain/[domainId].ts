import ProfitService from '@common/services/profitService/profit.service'
import { NextApiRequest, NextApiResponse } from 'next'
import { getCurrentUser } from '@utils/getCurrentUser'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { isGlobalAdmin } = await getCurrentUser(req, res)
  if (!isGlobalAdmin) return res.status(403).json({ success: false })

  const { domainId } = req.query

  try {
    if (req.method === 'GET') {
      const { page = '1', limit = '10' } = req.query
      const data = await ProfitService.getByDomain(
        domainId as string,
        +page,
        +limit
      )
      return res.status(200).json({ success: true, ...data })
    }

    return res.status(405).end()
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
