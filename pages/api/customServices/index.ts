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
        const { name, domainId, description } = req.body

        if (!name || !domainId) {
          return res.status(400).json({
            success: false,
            message: 'Missing required fields: name and domainId',
          })
        }

        const customService = await CustomService.create({
          name,
          domainId,
          description: description || '',
          fieldName: transliterateAndCamelCase(name),
        })

        return res.status(201).json({
          success: true,
          data: customService.toObject(),
        })
      } catch (error) {
        console.error('Error creating custom service:', error)
        return res.status(500).json({
          success: false,
          message: 'Internal server error',
        })
      }

    case 'GET':
      try {
        const domainIds = req.query.domainIds
          ? Array.isArray(req.query.domainIds)
            ? req.query.domainIds
            : [req.query.domainIds]
          : []

        const query =
          domainIds.length > 0 ? { domainId: { $in: domainIds } } : {}

        const customServices = await CustomService.find(query).lean()

        return res.status(200).json({
          success: true,
          data: customServices,
        })
      } catch (error) {
        console.error('Error fetching custom services:', error)
        return res.status(500).json({
          success: false,
          message: 'Internal server error',
        })
      }

    default:
      res.setHeader('Allow', ['POST', 'GET'])
      return res.status(405).json({
        success: false,
        message: `Method ${req.method} Not Allowed`,
      })
  }
}
