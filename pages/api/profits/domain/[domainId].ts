import ProfitService from '@common/services/profitService/profit.service'
import { NextApiRequest, NextApiResponse } from 'next'
import { getCurrentUser } from '@utils/getCurrentUser'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { isAdmin } = await getCurrentUser(req, res)
  if (!isAdmin) return res.status(403).json({ success: false })

  const { domainId } = req.query

  try {
    if (req.method === 'GET') {
      // limit counts MONTHS, not individual records
      const { page = '1', limit = '12' } = req.query
      const data = await ProfitService.getByDomainWithMonthSeparation(
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
