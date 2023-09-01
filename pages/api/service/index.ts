/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import RealEstate from '@common/modules/models/RealEstate'
import { getCurrentUser } from '@utils/getCurrentUser'
import Service from '@common/modules/models/Service'
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

        const { domainId, streetId, serviceId } = req.query
        if (isGlobalAdmin && domainId && streetId) {
          options.domain = domainId
          options.street = streetId
          const services = await Service.find(options).sort({ date: -1 })

          return res.status(200).json({
            success: true,
            data: services,
          })
        }

        // TODO: refactor with logic. each case should be well separated
        // Should I left all conditions and only one if for each role? 
        // this way it will handle all conditions and will not return wrong service

        // TODO: add tests
        // admin can have each service without limitation
        // domainAdmin can take service which is realated to his domain
        // user can take service which is related to his company which is ralated to domain
        if (serviceId) {
          options._id = serviceId
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
          const services = await Service.find(options).sort({ date: -1 })

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

          if (domainId && streetId) {
            const domainsIds = domains
              .map((i) => i._id)
              .filter((id) => id.toString() === domainId.toString())
            options.domain = { $in: domainsIds }
            options.street = streetId
          } else {
            const domainsIds = domains.map((i) => i._id)
            options.domain = { $in: domainsIds }
          }
        }

        if (isUser) {
          if (domainId || streetId) {
            options.domain = []
          } else {
            const realEstates = await RealEstate.find({
              adminEmails: { $in: [user.email] },
            }).populate({ path: 'domain', select: '_id' })
            const domainsIds = realEstates.map((i) => i.domain._id)
            options.domain = { $in: domainsIds }
          }
        }

        const services = await Service.find(options)
          .populate({ path: 'domain', select: '_id name' })
          .populate({ path: 'street', select: '_id address city' })
          .sort({ date: -1 })
          .limit(req.query.limit)

        return res.status(200).json({
          success: true,
          data: services,
        })
      } catch (error) {
        return res.status(400).json({ success: false, message: error })
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
