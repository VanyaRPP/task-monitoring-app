/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import Domain from '@common/modules/models/Domain'
import Service from '@common/modules/models/Service'
import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'
start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { isGlobalAdmin, isDomainAdmin, isAdmin, user } = await getCurrentUser(
    req,
    res
  )

  if (req.method === 'GET') {
    try {
      const { id } = req.query

      const service = await Service.findById(id)
        .populate('street')
        .populate('domain')

      if (!service) {
        return res.status(404).json({ error: 'not found' })
      }

      if (isGlobalAdmin) {
      } else if (isDomainAdmin) {
        if (!service.domain.adminEmails.includes(user.email)) {
          return res.status(403).json({ error: 'not allowed' })
        }
      } else if (isUser) {
        return res.status(403).json({ error: 'not allowed' })
      }

      return res.status(200).json(service)
    } catch (error) {
      return res.status(500).json({ error })
    }
  }

  switch (req.method) {
    case 'DELETE':
      try {
        if (!isGlobalAdmin) {
          return res
            .status(400)
            .json({ success: false, message: 'not allowed' })
        }
        await Service.findByIdAndRemove(req.query.id).then((service) => {
          if (service) {
            return res.status(200).json({
              success: true,
              data: 'Service ' + req.query.id + ' was deleted',
            })
          } else {
            return res.status(400).json({
              success: false,
              data: 'Service ' + req.query.id + ' was not found',
            })
          }
        })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }

    case 'PATCH':
      try {
        if (isAdmin) {
          if (isGlobalAdmin) {
            const response = await Service.findOneAndUpdate(
              { _id: req.query.id },
              req.body,
              { new: true }
            )
            return res.status(200).json({ success: true, data: response })
          } else {
            const domains = await Domain.find({
              adminEmails: { $in: [user.email] },
            })
            const domainIds = domains?.map((domain) => domain._id.toString())
            const validDomain = domainIds?.includes(req.body.domain._id)
            if (validDomain) {
              const response = await Service.findOneAndUpdate(
                { _id: req.query.id },
                req.body,
                { new: true }
              )
              return res.status(200).json({ success: true, data: response })
            }
            return res
              .status(400)
              .json({ success: false, message: 'not allowed' })
          }
        } else {
          return res
            .status(400)
            .json({ success: false, message: 'not allowed' })
        }
      } catch (error) {
        return res.status(400).json({ success: false, error: error.message })
      }
  }
}
