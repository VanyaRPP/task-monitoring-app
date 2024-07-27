import Domain from '@common/modules/models/Domain'
import RealEstate from '@common/modules/models/RealEstate'
import Street from '@common/modules/models/Street'
import start from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import { FilterQuery } from 'mongoose'
import type { NextApiRequest, NextApiResponse } from 'next'

start()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    await GET(req, res)
  }
}

const GET = async (req: NextApiRequest, res: NextApiResponse): Promise<any> => {
  try {
    const { isDomainAdmin, isGlobalAdmin, isUser, user } = await getCurrentUser(req, res)

    const options: FilterQuery<typeof Domain> = {}

    // TODO: getRelatedDomains aggregation
    if (isGlobalAdmin) {
    } else if (isDomainAdmin) {
      const relatedDomainsIds = (
        await Domain.distinct('_id', {
          adminEmails: user.email,
        })
      ).map((_id) => _id.toString())

      options._id = { $in: relatedDomainsIds }
    } else if (isUser) {
      const relatedDomainsIds = (
        await RealEstate.distinct('domain', {
          adminEmails: user.email,
        })
      ).map((id) => id.toString())

      options._id = { $in: relatedDomainsIds }
    }

    const [domainId, adminEmails, streetId] = await Promise.all([
      Domain.distinct('_id', options),
      Domain.distinct('adminEmails', options),
      Domain.distinct('streets', options),
    ])

    const domains = await Domain.find({ _id: { $in: domainId } }).select(['_id', 'name'])
    const streets = await Street.find({ _id: { $in: streetId } }).select(['_id', 'address', 'city'])

    return res.status(200).json({
      streets: streets.map((street) => ({
        value: street._id.toString(),
        text: `${street.address} (м. ${street.city})`,
      })),
      domains: domains.map((domain) => ({
        value: domain._id.toString(),
        text: domain.name,
      })),
      adminEmails: adminEmails.map((email) => ({
        value: email,
        text: email,
      })),
    })
  } catch (error) {
    return res.status(500).json({ message: 'unhandled server error' })
  }
}
