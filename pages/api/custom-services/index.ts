import CustomService from '@modules/models/CustomService'
import Domain from '@modules/models/Domain'
import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import { defaultServicesSet, isProtectedService } from '@utils/helpers'
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
            .json({ success: false, message: 'Не дозволено' })
        }

        const trimmedName = typeof name === 'string' ? name.trim() : name

        if (!trimmedName) {
          return res.status(400).json({
            success: false,
            message: 'Назва послуги не може бути порожньою',
          })
        }

        const escapedName = escapeRegex(trimmedName)
        const existingService = await CustomService.findOne({
          name: { $regex: `^${escapedName}$`, $options: 'i' },
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
          message: 'Помилка при створенні сервісу',
          error: error.message,
        })
      }

    case 'DELETE':
      try {
        if (!isGlobalAdmin) {
          return res.status(403).json({
            success: false,
            message: 'Тільки Global Admin може видаляти послуги',
          })
        }

        const { id } = req.query

        if (!id || Array.isArray(id)) {
          return res.status(400).json({
            success: false,
            message: 'Відсутній або некоректний id',
          })
        }

        if (defaultServicesSet.has(id)) {
          return res.status(403).json({
            success: false,
            message: 'Системні послуги не можна видаляти',
          })
        }

        const deletedService = await CustomService.findById(id).lean()

        if (!deletedService) {
          return res.status(404).json({
            success: false,
            message: 'Сервіс не знайдений',
          })
        }
        
        return res.status(200).json({
          success: true,
          data: 'Сервіс успішно видалено',
        })
      } catch (error: any) {
        return res.status(500).json({
          success: false,
          message: 'Помилка при видаленні сервісу',
          error: error.message,
        })
      }

    case 'GET':
      try {
        const { _id } = req.query

        if (isUser) {
          return res.status(400).json({
            success: false,
            message: 'Не дозволено',
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
          message: 'Помилка при отриманні сервісів',
          error: error.message,
        })
      }

    default:
      return res.status(405).json({
        success: false,
        message: `Метод ${req.method} не дозволений`,
      })
  }
}
