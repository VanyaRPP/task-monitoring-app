import Domain from '@common/modules/models/Domain'
import Service from '@common/modules/models/Service'
import Street from '@common/modules/models/Street'
import start from '@pages/api/api.config'
import { getMongoCount } from '@utils/getMongoCount'
import { getRelatedDomains, getRelatedServices } from '@utils/getRelated'
import { getCurrentUserData } from '@utils/getUserData'
import { NumberToFormattedMonth } from '@utils/helpers'
import { toFilters } from '@utils/toFilters'
import { toQuery } from '@utils/toQuery'
import { FilterQuery } from 'mongoose'
import type { NextApiRequest, NextApiResponse } from 'next'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getCurrentUserData(req, res)

  if (!user) {
    return res.status(401).json({ error: 'unauthorized user' })
  }

  if (req.method === 'GET') {
    try {
      const {
        serviceId: _serviceId,
        domainId: _domainId,
        streetId: _streetId,
        year,
        month,
        limit = 0,
        skip = 0,
      } = req.query

      const serviceId = toQuery(_serviceId)
      const domainId = toQuery(_domainId)
      const streetId = toQuery(_streetId)

      // TODO: fix this function to actually make filter by period possible
      // const period = toPeriodFiltersQuery<typeof Service>('date', {
      //   year: toQuery(year),
      //   month: toQuery(month),
      // })

      const options: FilterQuery<typeof Service> = {}
      const filters: FilterQuery<typeof Service> = {}

      options._id = { $in: await getRelatedServices(req, res, user) }
      options.domain = { $in: await getRelatedDomains(req, res, user) }

      // TODO: fix test data to properly distribute streets security
      // options.street = { $in: await getRelatedStreets(req, res, user) }

      if (serviceId) {
        filters._id = { $in: serviceId }
      }
      if (domainId) {
        filters.domain = { $in: domainId }
      }
      if (streetId) {
        filters.street = { $in: streetId }
      }
      // if (period) {
      //   filters.$expr = { $and: period }
      // }

      const services = await Service.find({ $and: [options, filters] })
        .skip(+skip)
        .limit(+limit)
        .populate('street')
        .populate('domain')

      const filter = {
        domain: toFilters(
          await Domain.find({
            _id: { $in: await Service.distinct('domain', options) },
          }),
          '_id',
          'name'
        ),
        street: toFilters(
          await Street.find({
            _id: { $in: await Service.distinct('street', options) },
          }),
          '_id',
          (street) => `вул. ${street.address} (м. ${street.city})`
        ),
        month: toFilters(
          await Service.distinct('date', options),
          (date) => new Date(date).getMonth() + 1,
          (date) => NumberToFormattedMonth(new Date(date).getMonth() + 1)
        ),
        year: toFilters(await Service.distinct('date', options), (date) =>
          new Date(date).getFullYear()
        ),
      }

      const total = await getMongoCount(Service, {
        $and: [options, filters],
      })

      return res.status(200).json({ data: services, filter, total })
    } catch (error) {
      console.log(error)

      return res.status(500).json({ error })
    }
  } else if (req.method === 'POST') {
    try {
      const service = await Service.create(req.body)

      return res.status(201).json(service)
    } catch (error) {
      return res.status(500).json({ error: error })
    }
  }
}
