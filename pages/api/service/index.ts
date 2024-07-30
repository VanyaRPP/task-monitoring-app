/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import Domain from '@modules/models/Domain'
import RealEstate from '@modules/models/RealEstate'
import Service from '@modules/models/Service'
import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'

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
        const { limit, domainId, streetId, serviceId, year, month } = req.query

        const options = {
          domain: { $in: domainId },
          street: { $in: streetId },
          _id: serviceId,
          date: {
            $gte: new Date(+year, +month, 1, 0, 0, 0), // first second of provided YY.MM
            $lt: new Date(+year, +month + 1, 0, 23, 59, 59, 999), // last second of provided YY.MM
          },
        }

        if (!serviceId) delete options._id
        if (!streetId) delete options.street
        if (!domainId) delete options.domain
        if (!year || !month || isNaN(Number(year)) || isNaN(Number(month)))
          delete options.date

        if (isGlobalAdmin) {
          const services = await Service.find(options)
            .limit(+limit)
            .populate('domain')
            .populate('street')

          return res.status(200).json({ success: true, data: services })
        }

        if (isDomainAdmin) {
          const domains = await Domain.find(
            options.domain
              ? {
                  _id: options.domain,
                  adminEmails: { $in: [user.email] },
                }
              : { adminEmails: { $in: [user.email] } }
          )

          if (domains) {
            options.domain = { $in: domains.map(({ _id }) => _id) }

            const services = await Service.find(options)
              .limit(+limit)
              .populate('domain')
              .populate('street')

            return res.status(200).json({ success: true, data: services })
          }
        }

        if (isUser) {
          const companies = await RealEstate.find(
            options.domain
              ? {
                  domain: options.domain,
                  adminEmails: { $in: [user.email] },
                }
              : {
                  adminEmails: { $in: [user.email] },
                }
          )

          if (companies) {
            options.domain = { $in: companies.map(({ domain }) => domain) }

            const services = await Service.find(options)
              .limit(+limit)
              .populate('domain')
              .populate('street')

            return res.status(200).json({ success: true, data: services })
          }
        }

        return res.status(200).json({ success: false, data: [] })
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
