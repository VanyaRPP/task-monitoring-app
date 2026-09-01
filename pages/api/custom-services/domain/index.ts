import CustomService from '@modules/models/CustomService'
import Domain from '@modules/models/Domain'
import start, { Data } from '@pages/api/api.config'
import {
  assembleDomainServiceCatalog,
  collectReferencedServiceIds,
} from '@common/services/customServiceService/customService.service'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  await start()

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

        // CustomServices scoped to this domain — the per-domain catalog. Used
        // both to resolve group members and to expose un-grouped services as a
        // synthetic bucket so the rest of the system (Payment Bulk,
        // RealEstateModal, invoice) can use them just like grouped ones.
        const allDomainServices = await CustomService.find({
          domain: domainId,
        }).lean()

        // Group ids can reference shared/seeded services (e.g. utility services
        // attached via a DomainTypeTemplate) that have no `domain` ref, so the
        // domain-scoped query above misses them. Fetch those explicitly by _id.
        const referencedIds = collectReferencedServiceIds(domain.customServices)
        const referencedServices = referencedIds.length
          ? await CustomService.find({ _id: { $in: referencedIds } }).lean()
          : []

        const responseData = assembleDomainServiceCatalog(
          domain.customServices,
          allDomainServices,
          referencedServices
        )

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
