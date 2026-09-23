import DebtCalculation from '@modules/models/DebtCalculation'
import { Data } from '@pages/api/api.config'
import { withErrorHandler } from '@utils/api-handler'
import { sanitizeSnapshot } from '@utils/debt-calculation/serialize'
import { getCurrentUser } from '@utils/getCurrentUser'
import mongoose from 'mongoose'
import type { NextApiRequest, NextApiResponse } from 'next'

const isId = (value: string): boolean => mongoose.Types.ObjectId.isValid(value)

/**
 * Adopts a record saved before the move to autosave.
 *
 * Back then a calculation had no `company` field, and the edits of every
 * company sat in `overrides` under `companyId` keys. We locate such a record
 * by that key and backfill `company`, so it keeps opening instead of quietly
 * going orphaned.
 */
async function adoptLegacy(domain: string, company: string) {
  const legacy = await DebtCalculation.findOne({
    domain,
    company: { $exists: false },
    [`overrides.${company}`]: { $exists: true },
  }).lean()

  if (!legacy) return null

  await DebtCalculation.updateOne({ _id: legacy._id }, { $set: { company } })

  return { ...legacy, company }
}

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
      const domain = String(req.query.domainId ?? '')
      const company = String(req.query.companyId ?? '')

      if (!isId(domain) || !isId(company)) {
        return res
          .status(400)
          .json({ success: false, message: 'Потрібні домен і квартира' })
      }

      const found =
        (await DebtCalculation.findOne({ domain, company }).lean()) ??
        (await adoptLegacy(domain, company))

      return res.status(200).json({ success: true, data: found ?? null })
    }

    case 'POST': {
      const snapshot = sanitizeSnapshot(req.body)

      if (!snapshot.domain || !snapshot.company) {
        return res
          .status(400)
          .json({ success: false, message: 'Потрібні домен і квартира' })
      }

      // Autosave sends the whole snapshot, so this is an upsert on the
      // (domain, company) pair - no names, no separate create/update.
      const saved = await DebtCalculation.findOneAndUpdate(
        { domain: snapshot.domain, company: snapshot.company },
        { $set: snapshot, $setOnInsert: { createdBy: user?._id } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      ).lean()

      return res.status(200).json({ success: true, data: saved })
    }

    default:
      return res
        .status(405)
        .json({ success: false, message: `Метод ${req.method} не дозволений` })
  }
}

export default withErrorHandler(debtCalculationHandler)
