// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next'
import RealEstate from '@common/modules/models/RealEstate'
import start, { ExtendedData } from '@pages/api/api.config'
import { withValidation } from './validator'

start()

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ExtendedData>
) {
  switch (req.method) {
    case 'GET':
      try {
        const realEstates = await getCompanies(req.query.id)
        const formatedRealEstates = await getCompaniesFormattedData(realEstates)
        return res
          .status(200)
          .json({ success: true, data: formatedRealEstates })
      } catch (error) {
        return res.status(400).json({ success: false, message: error.message })
      }
  }
}

async function getCompanies(domainId: string) {
  const realEstates = await RealEstate.find({
    domain: { $in: [domainId] },
  }).select('totalArea companyName rentPart -_id')

  if (realEstates.length === 0) {
    throw new Error('There are no companies yet')
  }
  return realEstates
}

export function getCompaniesFormattedData(realEstates) {
  const result = {
    companies: {
      companyNames: [],
      totalAreas: [],
      areasPercentage: [],
    },
    totalArea: 0,
  }
  result.totalArea = realEstates.reduce((sum, item) => item.totalArea + sum, 0)
  realEstates.forEach(({ companyName, totalArea, rentPart }) => {
    result.companies.companyNames.push(companyName)
    result.companies.totalAreas.push(totalArea)
    result.companies.areasPercentage.push(rentPart)
  })

  return result
}

export default withValidation(handler as NextApiHandler)
