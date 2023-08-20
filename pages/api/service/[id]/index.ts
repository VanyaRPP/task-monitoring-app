/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import Service from '@common/modules/models/Service'
import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { isGlobalAdmin, isDomainAdmin } = await getCurrentUser(req, res)

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
        if (isGlobalAdmin || isDomainAdmin) {
          // TODO: validation on allowed domain ID
          const current = await Service.findById(req.query.id)
          if (current) {
            const service = await Service.updateOne(
              { _id: req.query.id },
              { $set: req.body }
            )
            return res.status(200).json({ success: true })
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
