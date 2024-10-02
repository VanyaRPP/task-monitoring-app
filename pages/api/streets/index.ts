/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import Domain from '@modules/models/Domain'
import Street from '@modules/models/Street'
import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { isGlobalAdmin, isDomainAdmin, user } = await getCurrentUser(req, res)

  switch (req.method) {
    case 'GET':
      try {
        const { limit = 0 } = req.query

        const options = {}

        if (!isDomainAdmin && !isGlobalAdmin) {
          return res.status(200).json({ success: true, data: [] })
        }

        if (isDomainAdmin) {
          const adminDomains = await Domain.find({
            adminEmails: user.email,
          }).select('_id')

          const adminDomainIds = adminDomains.map((domain) =>
            domain._id.toString()
          )

          if (adminDomainIds.length === 0) {
            return res.status(200).json({ success: true, data: [] })
          }

          options._id = { $in: adminDomainIds }
        }

        const domains = await Domain.find(options)
          .limit(+limit)
          .populate('streets')

        const streets = domains.map((domain) => domain.streets).flat()

        return res.status(200).json({
          success: true,
          data: streets,
        })
      } catch (error) {
        return res.status(400).json({ success: false, error: error.message })
      }

    case 'POST':
      try {
        if (isGlobalAdmin) {
          const street = await Street.create(req.body)
          return res.status(200).json({ success: true, data: street })
        } else {
          return res
            .status(400)
            .json({ success: false, message: 'not allowed' })
        }
      } catch (error) {
        return res.status(400).json({ success: false })
      }
  }
}
