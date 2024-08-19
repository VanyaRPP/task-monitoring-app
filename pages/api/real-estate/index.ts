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
        companyId,
        domainId,
        streetId,
        name,
        adminEmail,
        limit = 0,
        skip = 0,
      } = req.query

      const companiesIds: string[] | null = companyId
        ? typeof companyId === 'string'
          ? companyId.split(',').map((id) => decodeURIComponent(id))
          : companyId.map((id) => decodeURIComponent(id))
        : null
      const names: string[] | null = name
        ? typeof name === 'string'
          ? name.split(',').map((id) => decodeURIComponent(id))
          : name.map((id) => decodeURIComponent(id))
        : null
      const domainsIds: string[] | null = domainId
        ? typeof domainId === 'string'
          ? domainId.split(',').map((id) => decodeURIComponent(id))
          : domainId.map((id) => decodeURIComponent(id))
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

      const options: FilterQuery<typeof RealEstate> = {}
      const filters: FilterQuery<typeof RealEstate> = {}

      if (isGlobalAdmin) {
        // GlobalAdmin security restrictions
      } else if (isDomainAdmin) {
        // DomainAdmin security restrictions
        const relatedDomainsIds = [
          ...(await Domain.distinct('_id', { adminEmails: user.email })).map(
            (id) => id.toString()
          ),
          ...(
            await RealEstate.distinct('domain', { adminEmails: user.email })
          ).map((id) => id.toString()),
        ]

        if (
          domainsIds?.filter((id) => !relatedDomainsIds.includes(id)).length
        ) {
          return res.status(403).json({
            error: 'restricte access to filter by domainId not related to you',
          })
        }

        const relatedCompaniesIds = (
          await RealEstate.distinct('_id', {
            $or: [
              { adminEmails: user.email },
              { domain: { $in: relatedDomainsIds } },
            ],
          })
        ).map((id) => id.toString())

        if (
          companiesIds?.filter((id) => !relatedCompaniesIds.includes(id)).length
        ) {
          return res.status(403).json({
            error: 'restricte access to filter by companyId not related to you',
          })
        }

        options._id = { $in: relatedCompaniesIds }
      } else if (isUser) {
        // User security restrictions
        const relatedCompanies = await RealEstate.find({
          adminEmails: user.email,
        })

        const relatedCompaniesIds = relatedCompanies.map(({ _id }) =>
          _id.toString()
        )

        if (
          companiesIds?.filter((id) => !relatedCompaniesIds.includes(id)).length
        ) {
          return res.status(403).json({
            error: 'restricte access to filter by companyId not related to you',
          })
        }

        const relatedDomainsIds = relatedCompanies.map(({ domain }) =>
          domain.toString()
        )

        if (
          domainsIds?.filter((id) => !relatedDomainsIds.includes(id)).length
        ) {
          return res.status(403).json({
            error:
              'restricte access to filter by domainId not related to your company',
          })
        }

        options._id = { $in: relatedCompaniesIds }
      }

      if (companiesIds) {
        filters._id = { $in: companiesIds }
      }
      if (names) {
        filters.companyName = { $in: names }
      }
      if (domainsIds) {
        filters.domain = { $in: domainsIds }
      }
      if (streetsIds) {
        filters.street = { $in: streetsIds }
      }
      if (adminsEmails) {
        filters.adminEmails = { $in: adminsEmails }
      }

      const companies = await RealEstate.find({ $and: [options, filters] })
        .skip(+skip)
        .limit(+limit)
        .populate('street')
        .populate('domain')

      const filter = {
        name: toFilters(await RealEstate.distinct('companyName', options)),
        domain: toFilters(
          await Domain.find({
            _id: { $in: await RealEstate.distinct('domain', options) },
          }),
          '_id',
          'name'
        ),
        street: toFilters(
          await Street.find({
            _id: { $in: await RealEstate.distinct('street', options) },
          }),
          '_id',
          (street) => `вул. ${street.address} (м. ${street.city})`
        ),
        adminEmails: toFilters(
          await RealEstate.distinct('adminEmails', options)
        ),
      }

      const total = await getMongoCount(RealEstate, {
        $and: [options, filters],
      })

      return res.status(200).json({ data: companies, filter, total })
    } catch (error) {
      return res.status(500).json({ error })
    }
  } else if (req.method === 'POST') {
    try {
      const company = await RealEstate.create(req.body)

      return res.status(201).json(company)
    } catch (error) {
      return res.status(500).json({ error: error })
    }
  }
}
