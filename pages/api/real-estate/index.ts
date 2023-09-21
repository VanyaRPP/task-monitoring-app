// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import RealEstate from '@common/modules/models/RealEstate'
import { getCurrentUser } from '@utils/getCurrentUser'
import start, { Data } from '@pages/api/api.config'
import Domain from '@common/modules/models/Domain'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { isGlobalAdmin, isDomainAdmin, isAdmin, isUser, user } =
    await getCurrentUser(req, res)

  switch (req.method) {
    case 'GET':
      try {
        const options = {}
        const { domainId, streetId, companyId, limit = 0 } = req.query

        if (domainId) options.domain = domainId
        if (streetId) options.street = streetId
        if (companyId) options._id = companyId

        if (isDomainAdmin) {
          const domains = await Domain.find({
            adminEmails: { $in: [user.email] },
          })
          const domainsIds = domains.map((i) => i._id.toString())
          if (domainId) {
            // TODO: add test. Domain admin can't fetch realEstate which is not belong to him
            if (!domainsIds.includes(domainId)) {
              return res
                .status(400)
                .json({
                  success: false,
                  message: 'not allowed to fetch such domainId',
                })
            }
          } else {
            options.domain = { $in: domainsIds }
          }
        }

        if (isUser) {
          options.adminEmails = { $in: [user.email] }
        }

        const realEstates = await RealEstate.find(options)
          .sort({ data: -1 }) // response doesnt contain such field
          .limit(+limit)
          .populate({
            path: 'domain',
            select: '_id name description',
          })
          .populate({ path: 'street', select: '_id address city' })

        return res.status(200).json({ success: true, data: realEstates })
      } catch (error) {
        return res.status(400).json({ success: false, message: error })
      }

    case 'POST':
      try {
        if (!isAdmin) {
          return res
            .status(400)
            .json({ success: false, message: 'not allowed' })
        }
        // TODO: body validation
        const realEstate = await RealEstate.create(req.body)
        return res.status(200).json({ success: true, data: realEstate })
      } catch (error) {
        return res.status(400).json({ success: false, message: error })
      }
  }
}
