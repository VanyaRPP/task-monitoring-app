import type { NextApiRequest, NextApiResponse } from 'next'
import start from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import PaymentChangeLog from '@common/modules/models/PaymentChangeLog'
import Domain from '@modules/models/Domain'
import RealEstate from '@common/modules/models/RealEstate'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res
      .status(405)
      .json({ success: false, message: 'Method not allowed' })
  }

  let perms: Awaited<ReturnType<typeof getCurrentUser>>
  try {
    perms = await getCurrentUser(req, res)
  } catch (error: any) {
    return res
      .status(401)
      .json({ success: false, message: error?.message ?? 'unauthorized' })
  }
  const { isGlobalAdmin, isDomainAdmin, user } = perms

  if (!isGlobalAdmin && !isDomainAdmin) {
    return res.status(403).json({ success: false, message: 'not allowed' })
  }

  const scope: Record<string, any> = {}
  if (!isGlobalAdmin) {
    const ownedDomains = await Domain.find({ adminEmails: user.email }).select(
      '_id'
    )
    scope.domainId = { $in: ownedDomains.map((d: any) => d._id) }
  }

  try {
    const [domainIds, companyIds] = await Promise.all([
      PaymentChangeLog.distinct('domainId', scope),
      PaymentChangeLog.distinct('companyId', scope),
    ])

    const dIds = (domainIds as any[]).filter(Boolean)
    const cIds = (companyIds as any[]).filter(Boolean)

    const [domainDocs, companyDocs] = await Promise.all([
      dIds.length
        ? Domain.find({ _id: { $in: dIds } }).select('name')
        : Promise.resolve([]),
      cIds.length
        ? RealEstate.find({ _id: { $in: cIds } }).select('companyName')
        : Promise.resolve([]),
    ])

    const domains = (domainDocs as any[]).map((d) => ({
      _id: d._id.toString(),
      name: d.name,
    }))
    const companies = (companyDocs as any[]).map((c) => ({
      _id: c._id.toString(),
      name: c.companyName,
    }))

    return res.status(200).json({ success: true, domains, companies })
  } catch (error: any) {
    return res
      .status(500)
      .json({ success: false, message: error?.message ?? 'unknown error' })
  }
}
