import CustomService from '@modules/models/CustomService'
import Domain from '@modules/models/Domain'
import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import { transliterateAndCamelCase } from '@utils/transliterateAndCamelCase'
import type { NextApiRequest, NextApiResponse } from 'next'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { isGlobalAdmin, isDomainAdmin, isUser } = await getCurrentUser(req, res)

  switch (req.method) {

    case 'GET':
      try {
        const { domainId } = req.query

        if (isUser) {
          return res.status(400).json({
            success: false,
            message: 'access denied',
          })
        }

        if (!domainId || Array.isArray(domainId)) {
          return res.status(400).json({
            success: false,
            message: 'Uncorrect domainId',
          });
        }

        const domain = await Domain.findById(domainId).lean();
        
        if (!domain) {
          return res.status(404).json({
            success: false,
            message: 'Domain not found',
          });
        }

        const customServiceIds = domain.domainServices || [];

        const customServices = await CustomService.find({
          _id: { $in: customServiceIds },
        }).lean();

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