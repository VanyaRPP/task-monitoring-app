/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import RealEstate from '@common/modules/models/RealEstate'
import { getCurrentUser } from '@utils/getCurrentUser'
import Service from '@common/modules/models/Service'
import start, { Data } from 'pages/api/api.config'
import Domain from '@common/modules/models/Domain'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { isGlobalAdmin, isDomainAdmin, isAdmin, isUser, user } = await getCurrentUser(
    req,
    res
  )

  switch (req.method) {
    case 'GET':
      try {
        const options = {}

        const { domainId, streetId } = req.query
        if (isGlobalAdmin && domainId && streetId) {
          options.domain = domainId
          options.street = streetId
          const services = await Service.find(options).sort({ data: -1 })

          return res.status(200).json({
            success: true,
            data: services,
          })
        }

        if (isGlobalAdmin) {
          if (req.query.email) {
            options.email = req.query.email
          }
        }

        if (isDomainAdmin) {
          const domains = await Domain.find({
            adminEmails: { $in: [user.email] },
          })
          const domainsIds = domains.map((i) => i._id)
          options.domain = { $in: domainsIds }
        }

        if (isUser) { 
          const realEstates = await RealEstate.find({
            adminEmails: { $in: [user.email] },
          }).populate({ path: 'domain', select: '_id' })
          const domainsIds = realEstates.map((i) => i.domain._id)
          options.domain = { $in: domainsIds }
        }

        const services = await Service.find(options)
          .populate({ path: 'domain', select: '_id name' })
          .populate({ path: 'street', select: '_id address city' })
          .sort({ data: -1 })
          .limit(req.query.limit)
        
        return res.status(200).json({
          success: true,
          data: services,
        })
      } catch (error) {
        return res.status(400).json({ success: false, message: error, error })
      }

    case 'POST':
      try {
        if (isAdmin) {
          // TODO: body validation
          const service = await Service.create(req.body)
          return res.status(200).json({ success: true, data: service })
        } else {
          return res
            .status(400)
            .json({ success: false, message: 'not allowed' })
        }
      } catch (error) {
        return res.status(400).json({ success: false, message: error })
      }
  }
}
