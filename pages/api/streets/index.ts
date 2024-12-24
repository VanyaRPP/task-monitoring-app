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
        const { limit = 0, domainId } = req.query;
        const options: Record<string, any> = {};

        if (isUser) {
          return res.status(200).json({ success: true, data: [] });
        }

        if (domainId && typeof domainId === 'string') {
          if (mongoose.Types.ObjectId.isValid(domainId)) {
            options._id = new mongoose.Types.ObjectId(domainId);
          } else {
            return res.status(400).json({
              success: false,
              message: 'Invalid domainId format',
            });
          }
        }

        if (isGlobalAdmin) {
          if (domainId) {
            const domain = await Domain.findOne(options).populate('streets');
            const streets = domain ? domain.streets : [];
            return res.status(200).json({
              success: true,
              data: _uniqBy(streets, '_id'),
            });
          } else {
            const streets = await Street.find({}).limit(+limit);
            return res.status(200).json({
              success: true,
              data: _uniqBy(streets, '_id'),
            });
          }
        }

        if (isDomainAdmin) {
          const adminDomains = await Domain.find({
            adminEmails: user.email,
          }).select('streets');

          if (!adminDomains.length) {
            return res.status(200).json({ success: true, data: [] });
          }

          const streetIds = adminDomains.flatMap((domain) => domain.streets);

          if (domainId) {
            const selectedDomain = await Domain.findOne({
              _id: domainId,
              adminEmails: user.email,
            }).select('streets');

            if (!selectedDomain) {
              return res.status(200).json({ success: true, data: [] });
            }

            const selectedStreetIds = selectedDomain.streets;
            const streets = await Street.find({
              _id: { $in: selectedStreetIds },
            }).limit(+limit);

            return res.status(200).json({
              success: true,
              data: streets,
            });
          } else {
            const streets = await Street.find({
              _id: { $in: streetIds },
            }).limit(+limit);

            return res.status(200).json({
              success: true,
              data: streets,
            });
          }
        }

        return res.status(400).json({
          success: false,
          message: 'Invalid user role or parameters',
        });
      } catch (error) {
        return res.status(400).json({ success: false, error: error.message });
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
