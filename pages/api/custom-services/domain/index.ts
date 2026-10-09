import start, { Data } from '@pages/api/api.config'
import { getDomainServiceCatalog } from '@common/services/customServiceService/customService.service'
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

        const responseData = await getDomainServiceCatalog(domainId)

        if (!responseData) {
          return res.status(404).json({
            success: false,
            message: 'Domain not found',
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
