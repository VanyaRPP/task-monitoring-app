import Domain from '@common/modules/models/Domain'
import RealEstate from '@common/modules/models/RealEstate'
import start from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import { FilterQuery } from 'mongoose'
import type { NextApiRequest, NextApiResponse } from 'next'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    await GET(req, res)
  }

  switch (req.method) {
    case 'POST':
      try {
        const { name, streets } = req.body

        const existingDomain = await Domain.findOne({
          name,
          streets: { $all: streets },
        })
        if (existingDomain) {
          return res
            .status(400)
            .json({ success: false, error: 'Домен з такими даними вже існує' })
        }

        await Domain.create(req.body)
          .then((domain) => {
            return res.status(201).json({ success: true, data: domain })
          })
          .catch((error) => {
            throw error
          })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
  }
}

const GET = async (req: NextApiRequest, res: NextApiResponse): Promise<any> => {
  try {
    const { isDomainAdmin, isGlobalAdmin, isUser, user } = await getCurrentUser(
      req,
      res
    )

    const {
      domainId,
      streetId,
      name,
      adminEmail,
      limit = 0,
      skip = 0,
    } = req.query

    // TODO: helper toQuery(any): string[] | null
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

    // TODO: getRelatedDomains aggregation
    if (isGlobalAdmin) {
    } else if (isDomainAdmin) {
      const relatedDomainsIds = (
        await Domain.distinct('_id', {
          adminEmails: user.email,
        })
      ).map((_id) => _id.toString())

      if (domainsIds?.filter((id) => !relatedDomainsIds.includes(id)).length) {
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

      if (domainsIds?.filter((id) => !relatedDomainsIds.includes(id)).length) {
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
      .skip(Number(skip))
      .limit(Number(limit))
      .populate('streets')

    // TODO: count documents and pass to `total`
    return res
      .status(200)
      .json({
        data: domains,
        total: await Domain.count({ $and: [options, filters] }),
      })
  } catch (error) {
    return res.status(500).json({ message: 'unhandled server error' })
  }
}
