/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import mongoose from 'mongoose'
import Domain from '@modules/models/Domain'
import Street from '@modules/models/Street'
import Service from '@modules/models/Service'
import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'
import _uniqBy from 'lodash/uniqBy'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { isGlobalAdmin, isDomainAdmin, isUser, user } = await getCurrentUser(req, res)

  switch (req.method) {
    case 'GET':
      try {
        const { limit = 0 } = req.query;

        if (isUser) {
          return res.status(200).json({ success: true, data: [] });
        }

        if (isGlobalAdmin) {
          const streets = await Street.find({}).limit(+limit);
          return res.status(200).json({
            success: true,
            data: _uniqBy(streets, '_id'),
          });
        }

        if (isDomainAdmin) {
          const adminDomains = await Domain.find({
            adminEmails: user.email,
          }).select('streets');

          if (!adminDomains.length) {
            return res.status(200).json({ success: true, data: [] });
          }

          const streetIds = adminDomains.flatMap((domain) => domain.streets);

          const streets = await Street.find({
            _id: { $in: streetIds },
          }).limit(+limit);

          return res.status(200).json({
            success: true,
            data: streets,
          });
        }
      } catch (error) {
        return res.status(400).json({ success: false, error: error.message })
      }


    case 'POST':
      try {
        if (isGlobalAdmin) {
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
