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
  const { isGlobalAdmin, isDomainAdmin, isUser } = await getCurrentUser(
    req,
    res
  )

  switch (req.method) {
    case 'POST':
      try {
        const { name, domainId } = req.body

        if (!isGlobalAdmin && !isDomainAdmin) {
          return res
            .status(400)
            .json({ success: false, message: 'Not allowed' })
        }

        const trimmedName = typeof name === 'string' ? name.trim() : name
        const trimmedDomainId =
          typeof domainId === 'string' ? domainId.trim() : domainId

        if (!trimmedName || !trimmedDomainId) {
          return res.status(400).json({
            success: false,
            message: 'Missing required fields: name and domainId',
          })
        }

        if (
          typeof trimmedDomainId !== 'string' ||
          trimmedDomainId.length === 0
        ) {
          return res.status(400).json({
            success: false,
            message: 'Invalid domainId',
          })
        }

        const customService = await CustomService.create({
          name: trimmedName,
          fieldName: transliterateAndCamelCase(trimmedName),
          domain: trimmedDomainId,
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
        const { domainId } = req.query

        if (
          !isGlobalAdmin &&
          (!domainId ||
            (typeof domainId === 'string' && domainId.trim().length === 0))
        ) {
          return res.status(400).json({
            success: false,
            message: 'domainId is required',
          })
        }

        const customServices = isGlobalAdmin
          ? await CustomService.find().lean()
          : await CustomService.find({
              domain: domainId,
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
