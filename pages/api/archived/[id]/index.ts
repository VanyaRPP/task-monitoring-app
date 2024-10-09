/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import start, { Data } from '@pages/api/api.config'
import RealEstate from '@modules/models/RealEstate'
import { getCurrentUser } from '@utils/getCurrentUser'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { isDomainAdmin, isGlobalAdmin, isAdmin } = await getCurrentUser(
    req,
    res
  )

  switch (req.method) {
    case 'PATCH':
      try {
        if (isAdmin) {
          const response = await RealEstate.findOneAndUpdate(
            { _id: req.query.id },
            { archived: req.body.archived },
            { new: true }
          )
          return res.status(200).json({ success: true, data: response })
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
