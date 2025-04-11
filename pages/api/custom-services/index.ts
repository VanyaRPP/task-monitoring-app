import CustomService from '@modules/models/CustomService'
import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import { transliterateAndCamelCase } from '@utils/transliterateAndCamelCase'
import type { NextApiRequest, NextApiResponse } from 'next'
import mongoose from 'mongoose'
import DomainModel from '@modules/models/Domain'

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
        const { name, domain } = req.body

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

        const customService = await CustomService.create({
          name: trimmedName,
          fieldName: transliterateAndCamelCase(trimmedName),
          domain: new mongoose.Types.ObjectId(domain),
        })
        await DomainModel.findByIdAndUpdate(
          domain,
          { $addToSet: { domainServices: customService._id } }
        )
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
      
          if (isUser) {
            return res.status(400).json({
              success: false,
              message: 'access denied',
            })
          }
      
          if (!domainId || Array.isArray(domainId)) {
            return res.status(400).json({
              success: false,
              message: 'Некорректный domainId',
            })
          }
    
          const customServices = await CustomService.find({
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
