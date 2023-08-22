/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import Service from '@common/modules/models/Service'
import Domain from '@common/modules/models/Domain'
import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { isGlobalAdmin, isAdmin, user } = await getCurrentUser(req, res)

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
            await Service.findOneAndUpdate({ _id: req.query.id }, req.body)
            return res.status(200).json({ success: true })
          } else {
            const domains = await Domain.find({
              adminEmails: { $in: [user.email] },
            })
            const domainId = req.body.domain._id || req.body.domain
            const domainIds = domains?.map((domain) => domain._id.toString())
            const validDomain = domainIds?.includes(domainId)
            if (validDomain) {
              await Service.findOneAndUpdate({ _id: req.query.id }, req.body)
              return res.status(200).json({ success: true })
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
