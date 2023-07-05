/* eslint-disable @typescript-eslint/ban-ts-comment */
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
  const { isDomainAdmin, isUser, user } = await getCurrentUser(req, res)

  switch (req.method) {
    case 'GET':
      try {
        if (isDomainAdmin) {
          const domains = await Domain.find({
            adminEmails: { $in: [user.email] },
          }).populate({path: 'streets', select: '_id address city'})
          // TODO: return more fields, add typisation
          // TODO: IDomain
          const data = domains.map((i) => ({
            _id: i._id,
            name: i.name,
            streets: i.streets
          }))
          return res.status(200).json({ success: true, data })
        }

        if (isUser) {
          const realEstates = await RealEstate.find({
            adminEmails: { $in: [user.email] },
          }).populate({ path: 'domain', select: 'name' })

          // TODO: return more fields, add typisation
          // TODO: IDomain
          const data = realEstates.map((i) => ({ name: i.domain.name }))
          return res.status(200).json({ success: true, data })
        }
        // TODO: global admin (???)
        return res.status(200).json({ success: true, data: [] })
      } catch (error) {
        return res.status(400).json({ success: false })
      }
    default:
      return res
        .status(405)
        .json({ success: false, message: 'Method Not Allowed' })
  }
}
