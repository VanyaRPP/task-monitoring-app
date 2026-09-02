import CustomService from '@modules/models/CustomService'
import Domain from '@modules/models/Domain'
import RealEstate from '@modules/models/RealEstate'
import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import { transliterateAndCamelCase } from '@utils/transliterateAndCamelCase'
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
        const { companyId } = req.query

        if (isUser) {
          return res.status(400).json({
            success: false,
            message: 'access denied',
          })
        }

        if (!companyId || Array.isArray(companyId)) {
          return res.status(400).json({
            success: false,
            message: 'Uncorrect domainId',
          })
        }

        const company = await RealEstate.findById(companyId).lean()

        if (!company) {
          return res.status(404).json({
            success: false,
            message: 'Domain not found',
          })
        }

        const customServiceIds =
          company.customServices || [].map((s: any) => s?._id).filter(Boolean)
        const customServices = await CustomService.find({
          _id: { $in: customServiceIds },
        }).lean()

        return res.status(200).json({
          success: true,
          data: customServices,
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
