/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import Street from '@modules/models/Street'
import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'
start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { isGlobalAdmin } = await getCurrentUser(req, res)

  if (!isGlobalAdmin) {
    return res.status(400).json({ success: false, message: 'not allowed' })
  }

  switch (req.method) {
    case 'DELETE':
      try {
        await Street.findByIdAndRemove(req.query.id).then((street) => {
          if (street) {
            return res.status(200).json({
              success: true,
              data: 'Street ' + req.query.id + ' was deleted',
            })
          } else {
            return res.status(400).json({
              success: false,
              data: 'Street ' + req.query.id + ' was not found',
            })
          }
        })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
    case 'PATCH':
      try {
        if (isGlobalAdmin) {
          const street = await Street.findByIdAndUpdate(req.query.id, req.body)
          return res.status(200).json({ success: true, data: street })
        } else {
          return res
            .status(400)
            .json({ success: false, message: 'not allowed' })
        }
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
  }
}
