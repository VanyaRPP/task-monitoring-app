/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import start, { Data } from '@pages/api/api.config'
import Street from '@common/modules/models/Street'
import Domain from '@common/modules/models/Domain'
import { getCurrentUser } from '@utils/getCurrentUser'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { isGlobalAdmin } = await getCurrentUser(req, res)

  switch (req.method) {
    case 'GET':
      try {
        const { domainId, limit, page = 1, } = req.query
        if (domainId) {
          const domain = await Domain.findOne({ _id: domainId }).populate({
            path: 'streets',
            select: '_id address city',
          })

          const streets = domain?.streets || [] 
            .sort({ data: -1 })
            .skip((page - 1) * limit)
            .limit(limit)

          return res
            .status(200)
            .json({ 
              success: true, 
              data: streets,
              total: (domain?.streets || [] ).length
            })
        }

        const totalStreets = await Street.count({});
        const streets = await Street.find({})
          .sort({ data: -1 })
          .skip((page - 1) * limit)
          .limit(limit)

        return res.status(200).json({
          success: true,
          total: totalStreets,
          data: streets,
        })
      } catch (error) {
        return res.status(400).json({ success: false, error: `${error}` })
      }

    case 'POST':
      try {
        if (isGlobalAdmin) {
          // TODO: body validation
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
