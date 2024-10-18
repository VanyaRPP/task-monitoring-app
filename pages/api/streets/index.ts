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
        const { limit = 0, domainId } = req.query
        const options = {}

        if (!isDomainAdmin && !isGlobalAdmin) {
          return res.status(200).json({ success: true, data: [] })
        }

        if (isDomainAdmin) {
          const adminDomains = await Domain.find({
            adminEmails: user.email,
          }).select('_id')

          const adminDomainIds = adminDomains.map((domain) =>
            domain._id.toString()
          )

          if (adminDomainIds.length === 0) {
            return res.status(200).json({ success: true, data: [] })
          }

          options._id = { $in: adminDomainIds }
        }

        if (domainId && typeof domainId === 'string') {
          if (mongoose.Types.ObjectId.isValid(domainId)) {
            options._id = new mongoose.Types.ObjectId(domainId)
          } else {
            return res
              .status(400)
              .json({ success: false, message: 'Invalid domainId format' })
          }
        }

        const domains = await Domain.find(options)
          .limit(+limit)
          .populate('streets')

        const streets = domains.flatMap((domain) => domain.streets)

        const streetIds = streets.map((street) => street._id)

        const servicesWithStreets = await Service.find({
          domain: domainId,
          street: { $in: streetIds },
        })

        const filteredStreets = streets.filter((street) =>
          servicesWithStreets.some(
            (service) => service.street.toString() === street._id.toString()
          )
        )

        const result = streets.map((street) => ({
          ...street._doc,
          hasService: filteredStreets.some(
            (filteredStreet) =>
              filteredStreet._id.toString() === street._id.toString()
          ),
        }))

        return res.status(200).json({
          success: true,
          data: _uniqBy(result, '_id'),
        })
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
