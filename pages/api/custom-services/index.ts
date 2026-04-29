import CustomService from '@modules/models/CustomService'
import Domain from '@modules/models/Domain'
import start, { Data } from '@pages/api/api.config'
import { ServiceType } from '@utils/constants'
import { getCurrentUser } from '@utils/getCurrentUser'
import { defaultServicesSet, isProtectedService } from '@utils/helpers'
import { transliterateAndCamelCase } from '@utils/transliterateAndCamelCase'
import mongoose from 'mongoose'
import type { NextApiRequest, NextApiResponse } from 'next'
import { escapeRegexForMongo } from '@utils/escape-regex/escape-regex'

const SERVICE_TYPE_VALUES = new Set<string>(Object.values(ServiceType))

function parseServiceTypeInput(raw: unknown): {
  ok: boolean
  value?: ServiceType | undefined
} {
  if (raw === undefined) return { ok: true, value: undefined }
  if (raw === null || raw === '') return { ok: true, value: undefined }
  const v = String(raw)
  if (!SERVICE_TYPE_VALUES.has(v)) return { ok: false }
  return { ok: true, value: v as ServiceType }
}

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

        const escapedName = escapeRegexForMongo(trimmedName)
        const existingService = await CustomService.findOne({
          name: { $regex: `^${escapedName}$`, $options: 'i' },
        })

        if (existingService) {
          return res.status(409).json({
            success: false,
            message: 'Послуга з такою назвою вже існує',
          })
        }

        const parsedType = parseServiceTypeInput(req.body?.serviceType)
        if (!parsedType.ok) {
          return res.status(400).json({
            success: false,
            message: 'Невалідний serviceType',
          })
        }

        const customService = await CustomService.create({
          name: trimmedName,
          fieldName: transliterateAndCamelCase(trimmedName),
          ...(parsedType.value ? { serviceType: parsedType.value } : {}),
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

        const deletedService = await CustomService.findByIdAndDelete(id)

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

    case 'PATCH':
      try {
        if (!isGlobalAdmin) {
          return res.status(403).json({
            success: false,
            message: 'Тільки Global Admin може редагувати послуги',
          })
        }

        const { id } = req.query
        const { name } = req.body

        if (!id || Array.isArray(id)) {
          return res.status(400).json({
            success: false,
            message: 'Відсутній або некоректний id',
          })
        }

        const trimmedName = typeof name === 'string' ? name.trim() : name

        if (!trimmedName) {
          return res.status(400).json({
            success: false,
            message: 'Назва послуги не може бути порожньою',
          })
        }

        const escapedName = escapeRegexForMongo(trimmedName)
        const existingService = await CustomService.findOne({
          name: { $regex: `^${escapedName}$`, $options: 'i' },
          _id: { $ne: id },
        })

        if (existingService) {
          return res.status(409).json({
            success: false,
            message: 'Послуга з такою назвою вже існує',
          })
        }

        const parsedType = parseServiceTypeInput(req.body?.serviceType)
        if (!parsedType.ok) {
          return res.status(400).json({
            success: false,
            message: 'Невалідний serviceType',
          })
        }

        const update: Record<string, unknown> = {
          name: trimmedName,
          fieldName: transliterateAndCamelCase(trimmedName),
        }
        if (req.body?.serviceType !== undefined) {
          if (parsedType.value) {
            update.serviceType = parsedType.value
          } else {
            update.$unset = { serviceType: '' }
          }
        }

        const updatedService = await CustomService.findByIdAndUpdate(
          id,
          update,
          { new: true }
        )

        if (!updatedService) {
          return res.status(404).json({
            success: false,
            message: 'Сервіс не знайдений',
          })
        }

        return res.status(200).json({
          success: true,
          data: updatedService.toObject(),
        })
      } catch (error: any) {
        return res.status(500).json({
          success: false,
          message: 'Помилка при оновленні сервісу',
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

        const hasExplicitIds =
          _id !== undefined && _id !== null && _id !== ''

        let customServices
        if (!hasExplicitIds) {
          customServices = await CustomService.find().lean()
        } else {
          const rawIds: string[] = Array.isArray(_id)
            ? _id.flatMap((value) => String(value).split(','))
            : String(_id).split(',')
          const validIds = rawIds
            .map((id) => id.trim())
            .filter((id) => mongoose.Types.ObjectId.isValid(id))

          customServices = validIds.length
            ? await CustomService.find({ _id: { $in: validIds } }).lean()
            : []
        }

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
