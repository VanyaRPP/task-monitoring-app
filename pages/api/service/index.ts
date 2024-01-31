/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import RealEstate from '@common/modules/models/RealEstate'
import { getCurrentUser } from '@utils/getCurrentUser'
import Service from '@common/modules/models/Service'
import start, { Data } from '@pages/api/api.config'
import Domain from '@common/modules/models/Domain'
import Street from '@common/modules/models/Street'
import {filterOptions, getFilterForAddress, getFilterForDomain} from '@utils/helpers'
import {getDomainsPipeline, getStreetsPipeline} from '@utils/pipelines'

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

        const { domainId, streetId, serviceId, limit = 0 } = req.query
        if (isGlobalAdmin && domainId && streetId) {
          options.domain = domainId
          options.street = streetId

          const expr = filterPeriodOptions(req.query)

          if (expr.length > 0) {
            options.$expr = { $and: expr }
          }
          const services = await Service.find(options)
            .sort({ date: -1 })
            .limit(+limit)

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
          const services = await Service.find(options)
            .sort({ date: -1 })
            .limit(+limit)

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

        if (streetId) {
          options.street = filterOptions(options?.street, streetId)
        }

        if (domainId) {
          options.domain = filterOptions(options?.domain, domainId)
        }

        const services = await Service.find(options)
          .sort({ date: -1 })
          .limit(+limit)
          .populate({ path: 'domain', select: '_id name' })
          .populate({ path: 'street', select: '_id address city' })

        const streetsPipeline = getStreetsPipeline(
          isGlobalAdmin,
          options.domain
        )

        const domainsPipeline = getDomainsPipeline(
          isGlobalAdmin,
          user.email
        )

        const domains = await Service.aggregate(domainsPipeline)
        const filterDomains = getFilterForDomain(domains)

        const streets = await Service.aggregate(streetsPipeline)
        const filterStreets = getFilterForAddress(streets)

        return res.status(200).json({
          success: true,
          data: services,
          addressFilter: filterStreets,
          domainFilter: filterDomains,
        })
      } catch (error) {
        return res.status(400).json({ success: false, error: error.message })
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

function filterPeriodOptions(args) {
  const { year, month } = args
  const filterByDateOptions = []
  if (year) {
    filterByDateOptions.push({ $eq: [{ $year: '$date' }, year] })
  }
  if (month) {
    filterByDateOptions.push({ $eq: [{ $month: '$date' }, month] })
  }
  return filterByDateOptions
}
