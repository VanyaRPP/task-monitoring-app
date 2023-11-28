// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import RealEstate from '@common/modules/models/RealEstate'
import Domain from '@common/modules/models/Domain'
import { getCurrentUser } from '@utils/getCurrentUser'
import start, { ExtendedData } from '@pages/api/api.config'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ExtendedData>
) {
  const { isUser, isDomainAdmin, isGlobalAdmin, user } = await getCurrentUser(
    req,
    res
  )

  switch (req.method) {
    case 'GET':
      try {
        const { limit = 0 } = req.query

        if (isGlobalAdmin) {
          const realEstates = await RealEstate.find({})
            .limit(+limit)
            .select('totalArea companyName -_id')
          if (realEstates.length === 0) {
            return res.status(400).json({
              success: false,
              message: 'There are no companies yet',
            })
          }
          return res.status(200).json({ success: true, data: realEstates })
        }
        if (isDomainAdmin) {
          const { _id } = await Domain.findOne({
            adminEmails: { $in: [user.email] },
          }).select('domain._id')
          if (!_id) {
            return res.status(400).json({
              success: false,
              message: 'You are not a domain',
            })
          }
          const realEstates = await RealEstate.find({
            domain: { $in: [_id.toString()] },
          })
            .limit(+limit)
            .select('totalArea companyName -_id')
          if (realEstates.length === 0) {
            return res.status(400).json({
              success: false,
              message: 'This domain has no associated companies.',
            })
          }
          return res.status(200).json({ success: true, data: realEstates })
        }

        if (isUser) {
          const { domain } = await RealEstate.findOne({
            adminEmails: { $in: [user.email] },
          }).select('domain')
          if (!domain) {
            return res.status(400).json({
              success: false,
              message: "You don't have a domain",
            })
          }
          const realEstates = await RealEstate.find({
            domain: { $in: [domain.toString()] },
          })
            .limit(+limit)
            .select('totalArea companyName -_id')
          if (realEstates.length === 0) {
            return res.status(400).json({
              success: false,
              message: 'The domain has no associated companies.',
            })
          }
          return res.status(200).json({ success: true, data: realEstates })
        }
      } catch (error) {
        console.log(error)
        return res.status(400).json({ success: false, message: error })
      }
  }
}
