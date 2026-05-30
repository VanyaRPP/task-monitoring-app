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

        // All CustomServices that belong to this domain — the catalog.
        // Includes services that are NOT referenced in any Domain.customServices
        // group, which we expose as a synthetic "ungrouped" entry below so the
        // rest of the system (Payment Bulk, RealEstateModal, invoice) can use
        // them just like grouped ones.
        const allDomainServices = await CustomService.find({
          domain: domainId,
        }).lean()

        const domainGroups = (domain.customServices || []).map(
          (service, index) => ({
            groupName: service?.groupName ?? `Група ${index + 1}`,
            services: service?.services || [],
          })
        )

        const groupedServices = domainGroups.map((group, index) => {
          const services = (group.services || [])
            .map((id) =>
              allDomainServices.find(
                (service) => String(service._id) === String(id)
              )
            )
            .filter(Boolean)

          return {
            groupName: group.groupName ?? `Група ${index + 1}`,
            services,
          }
        })

        const groupedIds = new Set(
          groupedServices.flatMap((group) =>
            group.services.map((service) => String(service._id))
          )
        )
        const ungroupedServices = allDomainServices.filter(
          (service) => !groupedIds.has(String(service._id))
        )

        const responseData: Array<{
          groupName: string | null
          services: unknown[]
        }> = [...groupedServices]

        if (ungroupedServices.length > 0) {
          // groupName: null is the marker for "not in any user-defined group".
          // Invoice renderer skips it so these services show as standalone rows.
          responseData.push({
            groupName: null,
            services: ungroupedServices,
          })
        }

        return res.status(200).json({
          success: true,
          data: responseData,
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
