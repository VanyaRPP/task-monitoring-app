/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { getFormattedDate } from '@common/assets/features/formatDate'
import Domain from '@modules/models/Domain'
import RealEstate from '@modules/models/RealEstate'
import Service from '@modules/models/Service'
import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import { FilterQuery } from 'mongoose'
import type { NextApiRequest, NextApiResponse } from 'next'
import {
  getDistinctCompanyAndDomain,
  getDistinctStreets,
  getFilterForAddress,
  getFormattedAddress,
} from '@utils/helpers'
import Street from '@modules/models/Street'

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
        const { limit, skip, domainId, streetId, serviceId, year, month } =
          req.query

        if (!isUser && !isDomainAdmin && !isGlobalAdmin) {
          return res.status(200).json({ success: false, data: [] })
        }

        const streetsIds: string[] | null = streetId
          ? typeof streetId === 'string'
            ? streetId.split(',').map((id) => decodeURIComponent(id))
            : streetId.map((id) => decodeURIComponent(id))
          : null

        const domainsIds: string[] | null = domainId
          ? typeof domainId === 'string'
            ? domainId.split(',').map((id) => decodeURIComponent(id))
            : domainId.map((id) => decodeURIComponent(id))
          : null

        const servicesIds: string[] | null = serviceId
          ? typeof serviceId === 'string'
            ? serviceId.split(',').map((id) => decodeURIComponent(id))
            : serviceId.map((id) => decodeURIComponent(id))
          : null

        const options: FilterQuery<typeof Service> = {}
        const filters: FilterQuery<typeof Service> = {}

        if (domainsIds) {
          filters.domain = { $in: domainsIds }
        }

        if (streetsIds) {
          filters.street = { $in: streetsIds }
        }

        if (servicesIds) {
          filters._id = { $in: servicesIds }
        }

        if (year && year !== 'null') {
          filters.$expr = filters.$expr || {}
          filters.$expr.$and = filters.$expr.$and || []
          filters.$expr.$and.push({
            $in: [
              { $year: '$date' },
              year
                .split(',')
                .map((y) => Number(y.trim()))
                .filter((y) => !isNaN(y)),
            ],
          })
        }

        if (month && month !== 'null') {
          filters.$expr = filters.$expr || {}
          filters.$expr.$and = filters.$expr.$and || []
          filters.$expr.$and.push({
            $in: [
              { $month: '$date' },
              month
                .split(',')
                .map((m) => Number(m.trim()))
                .filter((m) => !isNaN(m)),
            ],
          })
        }

        if (isDomainAdmin) {
          const domains = await Domain.find({
            ...(filters.domain ? { _id: filters.domain } : {}),
            adminEmails: { $in: [user.email] },
          })

          if (domains) {
            options.domain = { $in: domains.map(({ _id }) => _id) }
          }
        }

        if (isUser) {
          const companies = await RealEstate.find({
            ...(filters.domain ? { domain: filters.domain } : {}),
            adminEmails: { $in: [user.email] },
          })

          if (companies) {
            options.domain = { $in: companies.map(({ domain }) => domain) }
          }
        }

        const data = await Service.find({ $and: [options, filters] })
          .sort({ date: -1 })
          .limit(+limit)
          .skip(+skip)
          .populate('domain')
          .populate('street')

        const distinctStreets = await Service.distinct('street', options)
        const distinctDomains = await Service.distinct('domain', options)

        const [relatedDomains, relatedStreets, relatedYears, relatedMonths] =
          await Promise.all([
            Domain.find({ _id: { $in: distinctDomains } }).select([
              'name',
              '_id',
            ]),
            Street.find({ _id: { $in: distinctStreets } }).select([
              'address',
              'city',
              '_id',
            ]),
            Service.distinct('date', options).then((dates) => [
              ...new Set(dates.map((date) => new Date(date).getFullYear())),
            ]),
            Service.aggregate([
              { $match: options },
              { $group: { _id: { month: { $month: '$date' } } } },
              { $sort: { '_id.month': 1 } },
            ]).then((results) => [
              ...new Set(results.map((result) => result._id.month)),
            ]),
          ])

        const monthFilter = () => {
          const date = new Date()
          return relatedMonths.map((item) => {
            date.setMonth(item - 1)
            return { value: item, text: getFormattedDate(date) }
          })
        }

        return res.status(200).json({
          success: true,
          data: data,
          domainFilter: relatedDomains.map((item) => ({
            text: item.name,
            value: item._id,
          })),
          addressFilter: relatedStreets.map((item) => ({
            value: item._id,
            text: `${item.address} (м. ${item.city})`,
          })),
          yearFilter: relatedYears.map((item) => ({
            value: item,
            text: item.toString(),
          })),
          monthFilter: monthFilter(),
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
