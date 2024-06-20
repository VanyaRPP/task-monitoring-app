/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import Domain from '@common/modules/models/Domain'
import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { isDomainAdmin, isGlobalAdmin, user } = await getCurrentUser(req, res)

  switch (req.method) {
    case 'GET':
      try {
        const { limit = 0, domainId = [], streetId = [] } = req.query

        const domainIds = typeof domainId === 'string' ? [domainId] : domainId
        const streetIds = typeof streetId === 'string' ? [streetId] : streetId

        const options = {}

        if (!isDomainAdmin && !isGlobalAdmin) {
          return res.status(200).json({ success: true, data: [] })
        }

        if (isDomainAdmin) {
          options.adminEmails = user.email
        }

        if (domainIds?.length > 0) {
          options._id = { $in: domainIds }
        }

        if (streetIds?.length > 0) {
          options.streets = streetIds
        }

        const domains = await Domain.find(options).limit(+limit).populate('streets')

        return res.status(200).json({ success: true, data: domains })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
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
