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
  const { isGlobalAdmin, isDomainAdmin, isUser, user } = await getCurrentUser(
    req,
    res
  )

  switch (req.method) {
    case 'GET':
      try {
        const { limit = 0, domainId } = req.query
        const options: Record<string, any> = {}

        if (isUser) {
          return res.status(200).json({ success: true, data: [] })
        }

        if (domainId && typeof domainId === 'string') {
          if (mongoose.Types.ObjectId.isValid(domainId)) {
            options._id = new mongoose.Types.ObjectId(domainId)
          } else {
            return res.status(400).json({
              success: false,
              message: 'Invalid domainId format',
            })
          }
        }

        if (isGlobalAdmin) {
          let streets

          if (domainId) {
            const domain = await Domain.findOne(options).populate('streets')
            streets = domain ? domain.streets : []
          } else {
            streets = await Street.find({}).limit(+limit)
          }

          const streetIds = streets.map((street) => street._id)
          const servicesWithStreets = await Service.find({
            street: { $in: streetIds },
          })

          const result = streets.map((street) => ({
            ...street._doc,
            hasService: servicesWithStreets.some(
              (service) => service.street.toString() === street._id.toString()
            ),
          }))

          return res.status(200).json({
            success: true,
            data: _uniqBy(result, '_id'),
          })
        }

        if (isDomainAdmin) {
          const adminDomains = await Domain.find({
            adminEmails: user.email,
          }).select('streets')

          const adminStreetIds = adminDomains.flatMap(
            (domain) => domain.streets
          )

          const allDomains = await Domain.find({}).select('streets')
          const allUsedStreetIds = allDomains.flatMap(
            (domain) => domain.streets
          )
          const otherAdminsStreetIds = allUsedStreetIds.filter(
            (id) =>
              !adminStreetIds.some(
                (adminId) => adminId.toString() === id.toString()
              )
          )

          let streets

          if (domainId) {
            const selectedDomain = await Domain.findOne({
              _id: domainId,
              adminEmails: user.email,
            }).select('streets')

            if (!selectedDomain) {
              return res.status(200).json({ success: true, data: [] })
            }

            const selectedStreetIds = selectedDomain.streets
            streets = await Street.find({
              _id: { $in: selectedStreetIds },
            }).limit(+limit)
          } else {
            const freeStreets = await Street.find({
              _id: { $nin: allUsedStreetIds },
            })

            const domainStreets = adminStreetIds.length
              ? await Street.find({
                  _id: { $in: adminStreetIds },
                })
              : []

            const allAvailableStreetIds = [
              ...new Set([
                ...domainStreets.map((s) => s._id.toString()),
                ...freeStreets.map((s) => s._id.toString()),
              ]),
            ]

            streets = await Street.find({
              _id: { $in: allAvailableStreetIds },
            }).limit(+limit)
          }

          const allAvailableStreetIds = streets.map((s) => s._id)
          const servicesWithStreets = await Service.find({
            street: { $in: allAvailableStreetIds },
          })

          const result = streets.map((street) => ({
            ...street._doc,
            hasService: servicesWithStreets.some(
              (service) => service.street.toString() === street._id.toString()
            ),
          }))

          return res.status(200).json({
            success: true,
            data: result,
          })
        }

        return res.status(400).json({
          success: false,
          message: 'Invalid user role or parameters',
        })
      } catch (error) {
        return res.status(400).json({ success: false, error: error.message })
      }
    case 'POST':
      try {
        if (!isDomainAdmin && !isGlobalAdmin) {
          return res
            .status(403)
            .json({ success: false, message: 'Access denied: not an admin' })
        }

        const street = await Street.create(req.body)
        return res.status(200).json({ success: true, data: street })
      } catch (error) {
        return res.status(400).json({ success: false, error: error.message })
      }
  }
}
