import CustomService from '@modules/models/CustomService'
import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import { transliterateAndCamelCase } from '@utils/transliterateAndCamelCase'
import type { NextApiRequest, NextApiResponse } from 'next'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { isGlobalAdmin } = await getCurrentUser(req, res)

  // if (!isGlobalAdmin) {
  //   return res.status(400).json({ success: false, message: 'Not allowed' })
  // }

  switch (req.method) {
    case 'POST':
      try {
        const { name, domainId } = req.body

        if (!name || !domainId) {
          return res.status(400).json({
            success: false,
            message: 'Missing required fields: name and domainId',
          })
        }

        const customService = await CustomService.create({
          name,
          fieldName: transliterateAndCamelCase(name),
          domainId,
        })

        return res.status(201).json({
          success: true,
          data: customService.toObject(),
        })
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error creating service',
        })
      }

    case 'GET':
      try {
        const { domainId } = req.query

        if (!domainId) {
          return res.status(400).json({
            success: false,
            message: 'domainId is required',
          })
        }

        const customServices = await CustomService.find({ domainId }).lean()

        return res.status(200).json({
          success: true,
          data: customServices,
        })
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error fetching services',
        })
      }

    default:
      return res.status(405).json({
        success: false,
        message: `Method ${req.method} not allowed`,
      })
  }
}
