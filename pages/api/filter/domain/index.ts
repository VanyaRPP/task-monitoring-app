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
      const { realEstates, streets } = req.query
      const filteredCompanys =
        realEstates !== undefined && realEstates !== 'null'
          ? realEstates.split(',').map((id) => new mongoose.Types.ObjectId(id))
          : null
      const filteredStreets =
        streets !== undefined && streets !== 'null'
          ? streets.split(',').map((id) => new mongoose.Types.ObjectId(id))
          : null
      const { distinctDomains } = await getDistinctCompanyAndDomain({
        isGlobalAdmin,
        user,
        companyGroup: 'company',
        model: RealEstate,
        filters: {
          filteredCompanys: filteredCompanys,
          filteredStreets: filteredStreets,
        },
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
