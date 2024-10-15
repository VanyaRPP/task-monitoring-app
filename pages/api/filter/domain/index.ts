/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import Payment from '@modules/models/Payment'
import start from '@pages/api/api.config'
import { getDistinctCompanyAndDomain } from '@utils/helpers'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { isGlobalAdmin, user } = await getCurrentUser(req, res)

  if (req.method === 'GET') {
    try {
      const { distinctDomains } = await getDistinctCompanyAndDomain({
        isGlobalAdmin,
        user,
        companyGroup: 'company',
        model: Payment,
      })

      const domainsFilter = distinctDomains?.map(({ domainDetails }) => ({
        text: domainDetails.name,
        value: domainDetails._id,
      }))

      return res.status(200).json({ domainsFilter, success: true })
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message })
    }
  } else {
    return res
      .status(405)
      .json({ success: false, message: 'Method not allowed' })
  }
}
