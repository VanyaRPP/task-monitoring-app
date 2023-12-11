// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import RealEstate from '@common/modules/models/RealEstate'
import start, { ExtendedData } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import Domain from '@common/modules/models/Domain'

start()

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ExtendedData>
) {
  switch (req.method) {
    case 'GET':
      try {
        const { isGlobalAdmin, isDomainAdmin, isUser } = await getCurrentUser(
          req,
          res
        )
        const options = {}
        if (isUser) {
          const realEstatesData = await RealEstate.find(options)
            .select('totalArea companyName rentPart domain -_id')
            .populate({
              path: 'domain',
              select: 'name _id',
            })
          const result = await getCompaniesFormatedData(realEstatesData)
          return res.status(200).json({ success: true, data: result })
        }

        if (isGlobalAdmin || isDomainAdmin) {
          const domains = await Domain.find(options).populate({
            path: 'streets',
            select: '_id address city',
          })
          return res.status(200).json({ success: true, data: domains })
        }
        return res
          .status(400)
          .json({ success: false, error: 'You are not authorised' })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
  }
}

export function getCompaniesFormatedData(realEstates) {
  const groupedData = realEstates.reduce((res, el) => {
    const domainId = el.domain?._id.toString()
    const existingGroup = res.find((group) => group?.domainId === domainId)

    if (!existingGroup) {
      const newGroup = {
        domainId: domainId || 'NoDomain',
        domainName: el.domain?.name || 'NoDomain',
        companyAreas: [
          {
            companyName: el.companyName,
            totalArea: el.totalArea,
            rentPart: el.rentPart,
          },
        ],
      }
      res.push(newGroup)
    } else {
      existingGroup.companyAreas.push({
        companyName: el.companyName,
        totalArea: el.totalArea,
        rentPart: el.rentPart,
      })
    }
    return res
  }, [])

  return groupedData
}
export default handler
