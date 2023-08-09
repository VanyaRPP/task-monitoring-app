// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import RealEstate from '@common/modules/models/RealEstate'
import { getCurrentUser } from '@utils/getCurrentUser'
import start, { Data } from 'pages/api/api.config'
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
        const { domainId, streetId, domainIds, companyIds } = req.query
        const options = {}
        if (isGlobalAdmin && domainId && streetId) {
          options.domain = domainId
          options.street = streetId
        }

        if (isDomainAdmin) {
          const domains = await Domain.find({
            adminEmails: { $in: [user.email] },
          })
          const domainsIds = domains.map((i) => i._id)
          options.domain = { $in: domainsIds }
        }

        if (isUser) {
          options.adminEmails = { $in: [user.email] }
        }

        if (domainIds) {
          options.domain = filterOptions(options?.domain, domainIds)
        }

        if (companyIds) {
          options.company = filterOptions(options?.company, companyIds)
        }
        const realEstates = await RealEstate.find(options)
          .sort({ data: -1 })
          .limit(req.query.limit)
          .populate({
            path: 'domain',
            select: '_id name address bankInformation',
          })
          .populate({ path: 'street', select: '_id address city' })
        const total = await RealEstate.countDocuments(options)
        const domainsPipeline = [
          {
            $group: {
              _id: '$domain',
            },
          },
          {
            $lookup: {
              from: 'domains',
              localField: '_id',
              foreignField: '_id',
              as: 'domainDetails',
            },
          },
          {
            $unwind: '$domainDetails',
          },
          {
            $project: {
              'domainDetails.name': 1,
              'domainDetails._id': 1,
            },
          },
        ]
        const realEstatesPipeline = [
          {
            $group: {
              _id: '$company',
            },
          },
          {
            $lookup: {
              from: 'realestates',
              localField: '_id',
              foreignField: '_id',
              as: 'companyDetails',
            },
          },
          {
            $unwind: '$companyDetails',
          },
          {
            $project: {
              'companyDetails.companyName': 1,
              'companyDetails._id': 1,
            },
          },
        ]
        const distinctDomains = await RealEstate.aggregate(domainsPipeline)
        const distinctCompanies = await RealEstate.aggregate(
          realEstatesPipeline
        )
        return res.status(200).json({
          currentCompaniesCount: distinctCompanies.length,
          currentDomainsCount: distinctDomains.length,
          realEstatesFilter: distinctCompanies?.map(({ companyDetails }) => ({
            text: companyDetails.companyName,
            value: companyDetails._id,
          })),
          domainsFilter: distinctDomains?.map(({ domainDetails }) => ({
            text: domainDetails.name,
            value: domainDetails._id,
          })),
          total,
          success: true,
          data: realEstates,
        })
      } catch (error) {
        return res.status(400).json({ success: false, message: error })
      }

    case 'POST':
      try {
        if (!isAdmin) {
          return res
            .status(400)
            .json({ success: false, message: 'not allowed' })
        }
        // TODO: body validation
        const realEstate = await RealEstate.create(req.body)
        return res.status(200).json({ success: true, data: realEstate })
      } catch (error) {
        return res.status(400).json({ success: false, message: error })
      }
  }
}
function filterOptions(options = {}, filterIds) {
  const res = {
    ...options,
  } as any
  const idsFromQueryFilter = (filterIds || '').split(',') || []
  if (res.$in) {
    res.$in = res.$in.filter((i) => idsFromQueryFilter.includes(i))
    return res
  }
  res.$in = idsFromQueryFilter
  return res
}
