/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import RealEstate from '@common/modules/models/RealEstate'
import { getCurrentUser } from '@utils/getCurrentUser'
import start, { Data } from '@pages/api/api.config'
import Domain from '@common/modules/models/Domain'
import Street from '@common/modules/models/Street'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { isDomainAdmin, isGlobalAdmin, isUser, user } = await getCurrentUser(req, res)

  switch (req.method) {
    case 'GET':
      try {
        const { limit = 0, domainId } = req.query
        const options = {}
        
        if (isDomainAdmin) {
          options.adminEmails = { $in: [user.email] }
        }

        if (isUser) {
          return res.status(200).json({ success: true, data: [] })
        }

        if (domainId) {
          options._id = { $in: domainId }
        }

        const domains = await Domain.find(options).limit(+limit).populate({
          path: 'streets',
          select: '_id address city',
        })
        if (isGlobalAdmin && limit>0) {
          console.log(domains)
        }
        return res.status(200).json({ success: true, data: domains })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
    case 'POST':
      try {
        const { name, streets } = req.body

        const existingDomain = await Domain.findOne({
          name,
          streets: { $all: streets }
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
