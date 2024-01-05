/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import { authOptions } from '@pages/api/auth/[...nextauth]'
import RealEstate from '@common/modules/models/RealEstate'
import Domain from '@common/modules/models/Domain'
import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { user, isGlobalAdmin, isAdmin } = await getCurrentUser(req, res)

  switch (req.method) {
    case 'DELETE':
      try {
        if(isGlobalAdmin) {
          await RealEstate.findByIdAndRemove(req.query.id).then(
            (realEstate) => {
              if (realEstate) {
                return res.status(200).json({
                  success: true,
                  data: 'RealEstate ' + req.query.id + ' was deleted',
                })
              } else {
                return res.status(400).json({
                  success: false,
                  data: 'RealEstate ' + req.query.id + ' was not found',
                })
              }
            }
          )
        }
        return res.status(400).json({ success: false, message: 'not allowed' })
      } catch (error) {
        return res.status(400).json({ success: false, error })
      }

    case 'PATCH':
      try {
        if (isAdmin) {
          if (isGlobalAdmin) {
            const response = await RealEstate.findOneAndUpdate(
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
              const response = await RealEstate.findOneAndUpdate(
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
