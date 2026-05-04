import CustomService from '@modules/models/CustomService'
import Domain from '@modules/models/Domain'
import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import mongoose from 'mongoose'
import type { NextApiRequest, NextApiResponse } from 'next'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { isGlobalAdmin, isDomainAdmin, isUser } = await getCurrentUser(
    req,
    res
  )

  switch (req.method) {
    case 'GET':
      try {
        const { domainId } = req.query

        // if (isUser) {                    // Access for User
        //   return res.status(400).json({
        //     success: false,
        //     message: 'access denied',
        //   })
        // }

        if (!domainId || Array.isArray(domainId)) {
          return res.status(400).json({
            success: false,
            message: 'Uncorrect domainId',
          })
        }

        const domain = await Domain.findById(domainId).lean()

        if (!domain) {
          return res.status(404).json({
            success: false,
            message: 'Domain not found',
          })
        }

        if (!domain.customServices || domain.customServices.length === 0) {
          return res.status(200).json({
            success: true,
            data: [],
          })
        }

        const domainGroups = domain.customServices.map((service, index) => {
          return {
            groupName: service?.groupName ?? `Група ${index + 1}`,
            services: service?.services || [],
          }
        })

        const allServiceIds = domainGroups
          .flatMap((group) => group.services || [])
          .map(String)
          .filter((id) => mongoose.Types.ObjectId.isValid(id))

        if (allServiceIds.length === 0) {
          return res.status(200).json({
            success: true,
            data: domainGroups.map((group, index) => ({
              groupName: group.groupName ?? `Група ${index + 1}`,
              services: [],
            })),
          })
        }

        const customServices = await CustomService.find({
          _id: { $in: allServiceIds },
        }).lean()

        const groupedServices = domainGroups.map((group, index) => {
          const services = (group.services || [])
            .map((id) =>
              customServices.find(
                (service) => String(service._id) === String(id)
              )
            )
            .filter(Boolean)

          return {
            groupName: group.groupName ?? `Група ${index + 1}`,
            services,
          }
        })

        return res.status(200).json({
          success: true,
          data: groupedServices,
        })
      } catch (error: any) {
        return res.status(500).json({
          success: false,
          message: 'Error fetching services',
          error: error.message,
        })
      }

    default:
      return res.status(405).json({
        success: false,
        message: `Method ${req.method} not allowed`,
      })
  }
}
