/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import Street from '@modules/models/Street'
import Domain from '@modules/models/Domain'
import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  await start()

  const { isGlobalAdmin, isDomainAdmin, isAdmin, user } = await getCurrentUser(
    req,
    res
  )

  if (!isAdmin) {
    return res
      .status(403)
      .json({ success: false, message: 'Access denied: not an admin' })
  }

  switch (req.method) {
    case 'DELETE':
      try {
        if (isDomainAdmin && !isGlobalAdmin) {
          const streetId = req.query.id
          const adminDomains = await Domain.find({
            adminEmails: user.email,
            streets: streetId,
          })

          if (!adminDomains.length) {
            return res.status(403).json({
              success: false,
              message:
                'Access denied: street not found or you are not an admin of this street',
            })
          }
        }

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
        if (isDomainAdmin && !isGlobalAdmin) {
          const streetId = req.query.id
          const adminDomains = await Domain.find({
            adminEmails: user.email,
            streets: streetId,
          })

          if (!adminDomains.length) {
            return res.status(403).json({
              success: false,
              message:
                'Access denied: street not found or you are not an admin of this street',
            })
          }
        }

        const street = await Street.findByIdAndUpdate(req.query.id, req.body, {
          new: true,
        })
        return res.status(200).json({ success: true, data: street })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
  }
}
