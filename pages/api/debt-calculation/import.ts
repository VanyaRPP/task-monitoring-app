import type { NextApiRequest, NextApiResponse } from 'next'
import mongoose from 'mongoose'
import DebtCalculation from '@modules/models/DebtCalculation'
import { Data } from '@pages/api/api.config'
import { withErrorHandler } from '@utils/api-handler'
import { getCurrentUser } from '@utils/getCurrentUser'
import {
  loadImportTarget,
  StatementImportError,
} from '@common/services/paymentService/statementImport.service'
import { IDebtImportRow, mergeDebtImport } from '@utils/debt-calculation/import'
import {
  IDebtCalculationSnapshot,
  sanitizeSnapshot,
} from '@utils/debt-calculation/serialize'
import { MAX_IMPORT_MONTHS } from '@utils/debt-calculation/statement-plan'

const finite = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === '') return undefined
  const num = Number(value)
  return Number.isFinite(num) ? num : undefined
}

/** All-or-nothing: one bad row means the client sent something the user was not shown. */
const parseRows = (source: unknown): IDebtImportRow[] | null => {
  if (!Array.isArray(source) || source.length === 0) return null
  if (source.length > MAX_IMPORT_MONTHS) return null

  const rows: IDebtImportRow[] = []
  for (const raw of source) {
    const year = finite(raw?.year)
    const month = finite(raw?.month)
    const charged = finite(raw?.charged)
    const correction = finite(raw?.correction) ?? 0
    const paid = finite(raw?.paid)

    if (
      !Number.isInteger(year) ||
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12 ||
      charged === undefined ||
      paid === undefined
    ) {
      return null
    }
    rows.push({ year, month, charged, correction, paid })
  }

  return rows
}

/**
 * Fills a company's debt calculation with months read off statement photos.
 *
 * Separate from the autosave POST, which replaces the whole snapshot: this
 * MERGES into what is saved. The months land as editable rows marked «з
 * фото»; turning them into payments is a separate, deliberate step on the
 * page. Same access bar as that step: the user administers the domain, the
 * company is in it, and the domain bills a housing fee.
 */
async function debtCalculationImportHandler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    return res
      .status(405)
      .json({ success: false, message: `Метод ${req.method} не дозволений` })
  }

  const { isAdmin, isGlobalAdmin, user } = await getCurrentUser(req, res)
  if (!isAdmin) {
    return res.status(403).json({ success: false, message: 'Немає доступу' })
  }

  const domain = String(req.body?.domainId ?? '')
  const company = String(req.body?.companyId ?? '')
  const rows = parseRows(req.body?.rows)
  const openingDebt = finite(req.body?.openingDebt)

  if (
    !mongoose.Types.ObjectId.isValid(domain) ||
    !mongoose.Types.ObjectId.isValid(company) ||
    !rows
  ) {
    return res
      .status(400)
      .json({ success: false, message: 'Потрібні домен, компанія і місяці' })
  }

  try {
    await loadImportTarget(domain, company, { isGlobalAdmin, user })
  } catch (error) {
    if (error instanceof StatementImportError) {
      return res
        .status(error.status)
        .json({ success: false, message: error.message })
    }
    throw error
  }

  const existing = await DebtCalculation.findOne({ domain, company }).lean()
  const snapshot = sanitizeSnapshot(
    mergeDebtImport(
      existing as IDebtCalculationSnapshot | null,
      { domain, company, rows, openingDebt },
      new Date().toISOString()
    )
  )

  const saved = await DebtCalculation.findOneAndUpdate(
    { domain, company },
    { $set: snapshot, $setOnInsert: { createdBy: user?._id } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean()

  return res.status(200).json({ success: true, data: saved })
}

export default withErrorHandler(debtCalculationImportHandler)
