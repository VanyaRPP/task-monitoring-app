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
  const { isAdmin } = await getCurrentUser(req, res)

  switch (req.method) {
    case 'PATCH':
      try {
        if (!isAdmin) {
          return res
            .status(400)
            .json({ success: false, message: 'Не дозволено' })
        }

        const { id } = req.query
        if (!id || Array.isArray(id)) {
          return res.status(400).json({
            success: false,
            message: 'Відсутній або некоректний id',
          })
        }

        const { name } = req.body
        const trimmedName = typeof name === 'string' ? name.trim() : name

        if (!trimmedName) {
          return res.status(400).json({
            success: false,
            message: 'Назва послуги не може бути порожньою',
          })
        }

        const escapedName = escapeRegex(trimmedName)

        const existingService = await CustomService.findOne({
          _id: { $ne: id },
          name: { $regex: `^${escapedName}$`, $options: 'i' },
        })

        if (existingService) {
          return res.status(409).json({
            success: false,
            message: 'Послуга з такою назвою вже існує',
          })
        }

        const updatedService = await CustomService.findOneAndUpdate(
          { _id: id },
          {
            name: trimmedName,
            fieldName: transliterateAndCamelCase(trimmedName),
          },
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
          data: updatedService,
        })
      } catch (error: any) {
        return res.status(500).json({
          success: false,
          message: 'Помилка при оновленні сервісу',
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