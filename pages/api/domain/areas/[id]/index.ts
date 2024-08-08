// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import RealEstate from '@modules/models/RealEstate'
import start, { ExtendedData } from '@pages/api/api.config'
import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next'
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
        console.log(formatedRealEstates)
        return res
          .status(200)
          .json({ success: true, data: formatedRealEstates })
      } catch (error) {
        return res.status(400).json({ success: false, message: error.message })
      }
  }

  if(req.method === "GET"){
    const companies = await RealEstate.find({domain: {$in: [req.query.id]}}).select(["_id", "companyName", "rentPart", "totalArea"])
    console.log(companies)
    return res.status(200).json({ success: true, data: companies })
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
    companies: realEstates,
    totalArea: 0,
  }
  result.totalArea = realEstates.reduce((sum, item) => item.totalArea + sum, 0)
  return result
}

export default withValidation(handler as NextApiHandler)
