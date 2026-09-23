import DebtCalculation from '@modules/models/DebtCalculation'
import { Data } from '@pages/api/api.config'
import { withErrorHandler } from '@utils/api-handler'
import { sanitizeSnapshot } from '@utils/debt-calculation/serialize'
import { getCurrentUser } from '@utils/getCurrentUser'
import mongoose from 'mongoose'
import type { NextApiRequest, NextApiResponse } from 'next'

const MAX_NAME_LENGTH = 200

async function debtCalculationByIdHandler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { isAdmin } = await getCurrentUser(req, res)
  if (!isAdmin) {
    return res.status(403).json({ success: false, message: 'Немає доступу' })
  }

  const id = String(req.query.id ?? '')
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(400)
      .json({ success: false, message: 'Некоректний ідентифікатор' })
  }

  switch (req.method) {
    case 'GET': {
      const found = await DebtCalculation.findById(id).lean()
      if (!found) {
        return res
          .status(404)
          .json({ success: false, message: 'Розрахунок не знайдено' })
      }

      return res.status(200).json({ success: true, data: found })
    }

    case 'PATCH': {
      const snapshot = sanitizeSnapshot(req.body)
      const name = String(req.body?.name ?? '')
        .trim()
        .slice(0, MAX_NAME_LENGTH)

      const updated = await DebtCalculation.findByIdAndUpdate(
        id,
        { ...snapshot, ...(name ? { name } : {}) },
        { new: true }
      ).lean()

      if (!updated) {
        return res
          .status(404)
          .json({ success: false, message: 'Розрахунок не знайдено' })
      }

      return res.status(200).json({ success: true, data: updated })
    }

    case 'DELETE': {
      const deleted = await DebtCalculation.findByIdAndDelete(id).lean()
      if (!deleted) {
        return res
          .status(404)
          .json({ success: false, message: 'Розрахунок не знайдено' })
      }

      return res.status(200).json({ success: true, data: id })
    }

    default:
      return res
        .status(405)
        .json({ success: false, message: `Метод ${req.method} не дозволений` })
  }
}

export default withErrorHandler(debtCalculationByIdHandler)
