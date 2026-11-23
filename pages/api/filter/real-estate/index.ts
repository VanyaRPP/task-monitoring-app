/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import start from '@pages/api/api.config'
import { getDistinctCompanyAndDomain } from '@utils/helpers'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'
import RealEstate from '@modules/models/RealEstate'
import mongoose from 'mongoose'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await start()

  const { isGlobalAdmin, user } = await getCurrentUser(req, res)

  if (req.method === 'GET') {
    try {
      const { streets, domains, archived } = req.query
      const filteredStreets =
        streets !== undefined && streets !== 'null'
          ? streets.split(',').map((id) => new mongoose.Types.ObjectId(id))
          : null

      const filteredDomains =
        domains !== undefined && domains !== 'null'
          ? domains.split(',').map((id) => new mongoose.Types.ObjectId(id))
          : null

      const { distinctCompanies } = await getDistinctCompanyAndDomain({
        isGlobalAdmin,
        user,
        companyGroup: '_id',
        model: RealEstate,
        filters: {
          filteredStreets: filteredStreets,
          filteredDomains: filteredDomains,
          archived,
        },
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
