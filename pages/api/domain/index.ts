import Domain from '@common/modules/models/Domain'
import RealEstate from '@common/modules/models/RealEstate'
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
  const { isGlobalAdmin, isDomainAdmin, isUser, user } = await getCurrentUser(
    req,
    res
  )

  if (req.method === 'GET') {
    try {
      const {
        domainId,
        streetId,
        name,
        adminEmail,
        limit = 0,
        skip = 0,
      } = req.query

      const domainsIds: string[] | null = domainId
        ? typeof domainId === 'string'
          ? domainId.split(',').map((id) => decodeURIComponent(id))
          : domainId.map((id) => decodeURIComponent(id))
        : null
      const names: string[] | null = name
        ? typeof name === 'string'
          ? name.split(',').map((id) => decodeURIComponent(id))
          : name.map((id) => decodeURIComponent(id))
        : null
      const streetsIds: string[] | null = streetId
        ? typeof streetId === 'string'
          ? streetId.split(',').map((id) => decodeURIComponent(id))
          : streetId.map((id) => decodeURIComponent(id))
        : null
      const adminsEmails: string[] | null = adminEmail
        ? typeof adminEmail === 'string'
          ? adminEmail.split(',').map((id) => decodeURIComponent(id))
          : adminEmail.map((id) => decodeURIComponent(id))
        : null

      const options: FilterQuery<typeof Domain> = {}
      const filters: FilterQuery<typeof Domain> = {}

      if (isGlobalAdmin) {
      } else if (isDomainAdmin) {
        const relatedDomainsIds = (
          await Domain.find({
            adminEmails: user.email,
          })
        ).map(({ _id }) => _id.toString())

        if (
          domainsIds?.filter((id) => !relatedDomainsIds.includes(id)).length
        ) {
          return res.status(403).json({
            error: 'restricte access to filter by domainId not related to you',
          })
        }

        options._id = { $in: relatedDomainsIds }
      } else if (isUser) {
        const relatedDomainsIds = (
          await RealEstate.distinct('domain', {
            adminEmails: user.email,
          })
        ).map((id) => id.toString())

        if (
          domainsIds?.filter((id) => !relatedDomainsIds.includes(id)).length
        ) {
          return res.status(403).json({
            error:
              'restricte access to filter by domainId not related to your company',
          })
        }

        options._id = { $in: relatedDomainsIds }
      }

      if (domainsIds) {
        filters._id = { $in: domainsIds }
      }
      if (names) {
        filters.name = { $in: names }
      }
      if (streetsIds) {
        filters.streets = { $in: streetsIds }
      }
      if (adminsEmails) {
        filters.adminEmails = { $in: adminsEmails }
      }

      const domains = await Domain.find({ $and: [options, filters] })
        .skip(+skip)
        .limit(+limit)
        .populate('streets')

      const filter = {
        name: toFilters(await Domain.distinct('name', options)),
        streets: toFilters(
          await Street.find({
            _id: { $in: await Domain.distinct('streets', options) },
          }),
          '_id',
          (street) => `вул. ${street.address} (м. ${street.city})`
        ),
        adminEmails: toFilters(await Domain.distinct('adminEmails', options)),
      }

      const total = await getMongoCount(Domain, {})

      return res.status(200).json({ data: domains, filter, total })
    } catch (error) {
      return res.status(500).json({ error })
    }
  } else if (req.method === 'POST') {
    try {
      const { name, streets } = req.body

      const existingDomain = await Domain.findOne({
        name,
        streets: { $all: streets },
      })

      if (existingDomain) {
        return res
          .status(400)
          .json({ error: 'Домен з такими даними вже існує' })
      }

      const domain = await Domain.create(req.body)

      return res.status(201).json(domain)
    } catch (error) {
      return res.status(500).json({ error: error })
    }
  }
}
