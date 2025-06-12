import CustomService from '@modules/models/CustomService'
import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import { transliterateAndCamelCase } from '@utils/transliterateAndCamelCase'
import type { NextApiRequest, NextApiResponse } from 'next'

start()

function escapeRegex(str: string) {
  return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
}
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { isGlobalAdmin, isDomainAdmin, isUser } = await getCurrentUser(
    req,
    res
  )

  switch (req.method) {
    case 'POST':
      try {
        const { name } = req.body

        if (!isGlobalAdmin && !isDomainAdmin) {
          return res
            .status(400)
            .json({ success: false, message: 'Not allowed' })
        }

        const trimmedName = typeof name === 'string' ? name.trim() : name

        if (!trimmedName) {
          return res.status(400).json({
            success: false,
            message: 'Missing required fields: name',
          })
        }

        const escapedName = escapeRegex(trimmedName)
        const existingService = await CustomService.findOne({
          name: { $regex: `^${trimmedName}$`, $options: 'i' }, 
        })

        if (existingService) {
          return res.status(409).json({
            success: false,
            message: 'Послуга з такою назвою вже існує',
          })
        }

        const customService = await CustomService.create({
          name: trimmedName,
          fieldName: transliterateAndCamelCase(trimmedName),
        })

        return res.status(201).json({
          success: true,
          data: customService.toObject(),
        })
      } catch (error: any) {
        return res.status(500).json({
          success: false,
          message: 'Error creating service',
          error: error.message,
        })
      }

    case 'GET':
      try {
        const { _id } = req.query

        if (isUser) {
          return res.status(400).json({
            success: false,
            message: 'access denied',
          })
        }

        const customServiceIds =
          _id && !Array.isArray(_id) ? _id.split(',') : _id

        const customServices = !customServiceIds
          ? await CustomService.find().lean()
          : await CustomService.find({
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
