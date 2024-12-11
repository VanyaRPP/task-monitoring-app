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
  const { isGlobalAdmin, isDomainAdmin, user } = await getCurrentUser(req, res)

    switch (req.method) {
    case 'GET':
      try {
        const { limit = 0, domainId } = req.query;

        if (!isDomainAdmin && !isGlobalAdmin) {
          return res.status(200).json({ success: true, data: [] });
        }

        const streetQuery: Record<string, any> = {};

        if (domainId && typeof domainId === 'string') {
          if (mongoose.Types.ObjectId.isValid(domainId)) {
            streetQuery.domain = new mongoose.Types.ObjectId(domainId);
          } else {
            return res
              .status(400)
              .json({ success: false, message: 'Invalid domainId format' });
          }
        }

        const streets = await Street.find(streetQuery).limit(+limit);

        const streetIds = streets.map((street) => street._id);
        const servicesWithStreets = await Service.find({
          street: { $in: streetIds },
        });

        const result = streets.map((street) => ({
          ...street._doc,
          hasService: servicesWithStreets.some(
            (service) => service.street.toString() === street._id.toString()
          ),
        }));

        return res.status(200).json({
          success: true,
          data: _uniqBy(result, '_id'),
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
