/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import RealEstate from '@common/modules/models/RealEstate'
import { getCurrentUser } from '@utils/getCurrentUser'
import start, { Data } from 'pages/api/api.config'
import Domain from 'common/modules/models/Domain'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { isGlobalAdmin, isDomainAdmin, isUser, user } = await getCurrentUser(
    req,
    res
  )

  switch (req.method) {
    case 'GET':
      try {
        const options = {}

        // one domain by id
        if (req.query.domainId) {
          options._id = { $in: [req.query.domainId] }
        }
        // all domains
        else if (isGlobalAdmin) {
          // just don't change options
        }
        // all domains where the user is administrator
        else if (isDomainAdmin) {
          options.adminEmails = { $in: [user.email] }
        }
        // all domains where the user is company administrator
        else if (isUser) {
          const realEstates = await RealEstate.find({
            adminEmails: { $in: [user.email] },
          }).populate({ path: 'domain', select: 'name' })

          options._id = realEstates.map((i) => i.domain._id)
        }

        const domains = await Domain.find(options)
          .limit(req.query.limit)
          .populate({
            path: 'streets',
            select: '_id address city',
          })
        return res.status(200).json({ success: true, data: domains })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
    case 'POST':
      try {
        // TODO body validation
        await Domain.create(req.body)
          .then((domain) => {
            return res.status(201).json({ success: true, data: domain })
          })
          .catch((error) => {
            throw error
          })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
  }
}
