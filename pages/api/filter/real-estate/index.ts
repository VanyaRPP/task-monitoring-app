/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import start from '@pages/api/api.config'
import { getDistinctCompanyAndDomain } from '@utils/helpers'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'
import RealEstate from '@modules/models/RealEstate'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { isGlobalAdmin, user } = await getCurrentUser(req, res)

  if (req.method === 'GET') {
    try {
      const { distinctCompanies } = await getDistinctCompanyAndDomain({
        isGlobalAdmin,
        user,
        companyGroup: '_id',
        model: RealEstate,
      })

      const realEstatesFilter = distinctCompanies?.map(
        ({ companyDetails }) => ({
          text: companyDetails.companyName,
          value: companyDetails._id,
        })
      )

      return res.status(200).json({ realEstatesFilter, success: true })
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message })
    }
  } else {
    return res
      .status(405)
      .json({ success: false, message: 'Method not allowed' })
  }
}
