import Street from '@common/modules/models/Street'
import start from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import { getMongoCount } from '@utils/getMongoCount'
import { FilterQuery } from 'mongoose'
import type { NextApiRequest, NextApiResponse } from 'next'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { isGlobalAdmin } = await getCurrentUser(req, res)

  if (req.method === 'GET') {
    try {
      const { domainId, city, address, limit = 0, skip = 0 } = req.query

      const options: FilterQuery<typeof Street> = {}

      if (domainId) {
        options.domain = {
          $in:
            typeof domainId === 'string'
              ? domainId.split(',').map((id) => decodeURIComponent(id))
              : domainId.map((id) => decodeURIComponent(id)),
        }
      }

      const filters: FilterQuery<typeof Street> = {}

      if (city) {
        filters.city = {
          $in:
            typeof city === 'string'
              ? city.split(',').map((id) => decodeURIComponent(id))
              : city.map((id) => decodeURIComponent(id)),
        }
      }
      if (address) {
        filters.address = {
          $in:
            typeof address === 'string'
              ? address.split(',').map((id) => decodeURIComponent(id))
              : address.map((id) => decodeURIComponent(id)),
        }
      }

      const streets = await Street.find({ ...options, ...filters })
        .skip(+skip)
        .limit(+limit)

      const filter = {
        city: (await Street.distinct('city', options)).map((city) => ({
          text: city,
          value: city,
        })),
        address: (await Street.distinct('address', options)).map((address) => ({
          text: address,
          value: address,
        })),
      }
      const total = await getMongoCount(Street, { ...options, ...filters })

      return res.status(200).json({
        data: streets,
        filter,
        total,
      })
    } catch (error) {
      return res.status(500).send(error)
    }
  } else if (req.method === 'POST') {
    try {
      if (!isGlobalAdmin) {
        return res.status(403).send('restricted access')
      }

      if (!req.body) {
        return res.status(400).send('unhandled body')
      }

      // TODO: body validation
      const street = await Street.create(req.body)

      if (!street) {
        return res.status(422).send('unable to create street')
      }

      return res.status(200).json(street)
    } catch (error) {
      return res.status(500).send(error)
    }
  }
}
