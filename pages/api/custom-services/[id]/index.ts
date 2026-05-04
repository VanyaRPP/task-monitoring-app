/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
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
    case 'PATCH':
      try {
        if (!(isGlobalAdmin || isDomainAdmin || isAdmin)) {
          return res
            .status(400)
            .json({ success: false, message: 'Not allowed' })
        }

        const { name } = req.body
        const trimmedName = typeof name === 'string' ? name.trim() : name

        if (!trimmedName) {
          return res.status(400).json({
            success: false,
            message: 'Name cannot be empty',
          })
        }

        const escapedName = escapeRegex(trimmedName)

        const existingService = await CustomService.findOne({
          _id: { $ne: req.query.id },
          name: { $regex: `^${escapedName}$`, $options: 'i' },
        })

        if (existingService) {
          return res.status(400).json({
            success: false,
            message: 'Service with this name already exists',
          })
        }

        const updatedService = await CustomService.findOneAndUpdate(
          { _id: req.query.id },
          {
            name: trimmedName,
            fieldName: transliterateAndCamelCase(trimmedName),
          },
          { new: true }
        )

        return res.status(200).json({
          success: true,
          data: updatedService,
        })
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: error.message,
        })
      }
  }
}