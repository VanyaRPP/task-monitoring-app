import DebtCalculation from '@modules/models/DebtCalculation'
import { Data } from '@pages/api/api.config'
import { withErrorHandler } from '@utils/api-handler'
import { sanitizeSnapshot } from '@utils/debt-calculation/serialize'
import { getCurrentUser } from '@utils/getCurrentUser'
import mongoose from 'mongoose'
import type { NextApiRequest, NextApiResponse } from 'next'

const MAX_NAME_LENGTH = 200

async function debtCalculationHandler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { isAdmin, user } = await getCurrentUser(req, res)
  if (!isAdmin) {
    return res.status(403).json({ success: false, message: 'Немає доступу' })
  }

  switch (req.method) {
    case 'GET': {
      const domainId = String(req.query.domainId ?? '')
      const filter = mongoose.Types.ObjectId.isValid(domainId)
        ? { domain: domainId }
        : {}

      const list = await DebtCalculation.find(filter)
        .sort({ updatedAt: -1 })
        .lean()

      return res.status(200).json({ success: true, data: list })
    }

    case 'POST': {
      const name = String(req.body?.name ?? '')
        .trim()
        .slice(0, MAX_NAME_LENGTH)
      if (!name) {
        return res
          .status(400)
          .json({ success: false, message: 'Потрібна назва розрахунку' })
      }

      const snapshot = sanitizeSnapshot(req.body)
      if (!snapshot.domain) {
        return res
          .status(400)
          .json({ success: false, message: 'Потрібен домен' })
      }

      const created = await DebtCalculation.create({
        ...snapshot,
        name,
        createdBy: user?._id,
      })

      return res.status(201).json({ success: true, data: created })
    }

    default:
      return res
        .status(405)
        .json({ success: false, message: `Метод ${req.method} не дозволений` })
  }
}

export default withErrorHandler(debtCalculationHandler)
