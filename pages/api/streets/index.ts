import Domain from '@common/modules/models/Domain'
import Street from '@common/modules/models/Street'
import start from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import { getMongoCount } from '@utils/getMongoCount'
import { toFilters } from '@utils/toFilters'
import { FilterQuery } from 'mongoose'
import type { NextApiRequest, NextApiResponse } from 'next'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { isGlobalAdmin, isDomainAdmin, user } = await getCurrentUser(req, res)

  if (req.method === 'GET') {
    try {
      const { domainId, city, address, limit = 0, skip = 0 } = req.query

      const options: FilterQuery<typeof Street> = {}

      if (domainId) {
        if (!isGlobalAdmin && !isDomainAdmin) {
          return res
            .status(403)
            .json({ error: 'restricted access to filter by domain' })
        }

        const domains = await Domain.find({
          _id: {
            $in:
              typeof domainId === 'string'
                ? domainId.split(',').map((id) => decodeURIComponent(id))
                : domainId.map((id) => decodeURIComponent(id)),
          },
        }).populate('streets')

        if (
          !isGlobalAdmin &&
          domains.find(({ adminEmails }) => !adminEmails.includes(user.email))
        ) {
          return res.status(403).json({
            error: 'restricted access to filter by domain not related to user',
          })
        }

        const streetsIds = domains
          .map(({ streets }) => streets.map(({ _id }) => _id.toString()))
          .flat()

        if (domains) {
          options._id = { $in: streetsIds }
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
        city: toFilters(await Street.distinct('city', options)),
        address: toFilters(await Street.distinct('address', options)),
      }

      const total = await getMongoCount(Street, { ...options, ...filters })

      return res.status(200).json({
        data: streets,
        filter,
        total,
      })
    } catch (error) {
      return res.status(500).json({ error })
    }
  } else if (req.method === 'POST') {
    try {
      if (!isGlobalAdmin) {
        return res.status(403).json({ error: 'restricted access' })
      }

      if (!req.body) {
        return res.status(400).json({ error: 'unhandled body' })
      }

      // TODO: body validation
      const street = await Street.create(req.body)

      if (!street) {
        return res.status(422).json({ error: 'unable to create street' })
      }

      return res.status(200).json(street)
    } catch (error) {
      return res.status(500).json({ error })
    }
  }
}
