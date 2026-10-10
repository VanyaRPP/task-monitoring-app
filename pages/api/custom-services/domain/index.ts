import Domain from '@modules/models/Domain'
import RealEstate from '@modules/models/RealEstate'
import { isValidObjectId } from 'mongoose'
import start, { Data } from '@pages/api/api.config'
import { getDomainServiceCatalog } from '@common/services/customServiceService/customService.service'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  await start()

  const { isGlobalAdmin, user } = await getCurrentUser(req, res)

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

        // A domain's catalog is for those who bill in it or are billed by it:
        // its admins and the owners of its companies (whose invoice preview
        // groups lines by it). Not any signed-in user for any domain.
        if (!isGlobalAdmin) {
          const allowed =
            isValidObjectId(domainId) &&
            ((await Domain.exists({
              _id: domainId,
              adminEmails: user.email,
            })) ||
              (await RealEstate.exists({
                domain: domainId,
                adminEmails: user.email,
              })))
          if (!allowed) {
            return res
              .status(403)
              .json({ success: false, message: 'not allowed' })
          }
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
