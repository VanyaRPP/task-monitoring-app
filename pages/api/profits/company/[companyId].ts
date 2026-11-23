import ProfitService from '@common/services/profitService/profit.service'
import RealEstate from '@modules/models/RealEstate'
import { NextApiRequest, NextApiResponse } from 'next'
import { getCurrentUser } from '@utils/getCurrentUser'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res
      .status(405)
      .json({ success: false, message: 'Method not allowed' })
  }

  const { isGlobalAdmin, user } = await getCurrentUser(req, res)
  const { companyId } = req.query

  try {
    // Company owner or GlobalAdmin only - unlike the domain ledger, a
    // DomainAdmin does not automatically get this, even for a company that
    // lives in their own domain. This is the company's own billing view.
    if (!isGlobalAdmin) {
      const owns = await RealEstate.exists({
        _id: companyId,
        adminEmails: user.email,
      })
      if (!owns) return res.status(403).json({ success: false })
    }

    // limit counts MONTHS, not individual records
    const { page = '1', limit = '12' } = req.query
    const data = await ProfitService.getByCompanyWithMonthSeparation(
      companyId as string,
      +page,
      +limit
    )
    return res.status(200).json({ success: true, ...data })
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
