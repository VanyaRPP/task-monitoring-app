import type { NextApiRequest, NextApiResponse } from 'next'
import mongoose from 'mongoose'
import start from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import {
  applyCompanyStatementImport,
  loadImportTarget,
  planCompanyStatementImport,
  StatementImportError,
} from '@common/services/paymentService/statementImport.service'
import {
  sanitizeResolutions,
  sanitizeStatementImport,
} from '@utils/debt-calculation/statement-plan'

const MAX_SOURCE_LENGTH = 200

/**
 * A debt statement read off photos → the company's payments.
 *
 * `apply: false` (the default) only plans: it tells, month by month, what is
 * new, what the system already has, and where the two disagree - the chat
 * card shows that and asks about each conflict. `apply: true` recomputes the
 * plan from the DB and writes, honouring the choices in `resolutions`.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res
      .status(405)
      .json({ success: false, message: 'Method not allowed' })
  }

  await start()

  let perms: Awaited<ReturnType<typeof getCurrentUser>>
  try {
    perms = await getCurrentUser(req, res)
  } catch {
    return res.status(401).json({ success: false, message: 'unauthorized' })
  }
  const { isDomainAdmin, isGlobalAdmin, user } = perms

  // Same bar as the other bulk payment writes (multiple delete, mark-paid).
  if (!isDomainAdmin && !isGlobalAdmin) {
    return res.status(403).json({ success: false, message: 'not allowed' })
  }

  const body = req.body ?? {}
  const domainId = String(body.domainId ?? '')
  const companyId = String(body.companyId ?? '')
  const statement = sanitizeStatementImport(body.statement)

  if (
    !mongoose.Types.ObjectId.isValid(domainId) ||
    !mongoose.Types.ObjectId.isValid(companyId) ||
    !statement
  ) {
    return res
      .status(400)
      .json({ success: false, message: 'Потрібні домен, компанія і місяці' })
  }

  const actor = { isGlobalAdmin, user }

  try {
    const target = await loadImportTarget(domainId, companyId, actor)

    if (body.apply !== true) {
      const plan = await planCompanyStatementImport(target, statement)
      return res.status(200).json({ success: true, data: { plan } })
    }

    const data = await applyCompanyStatementImport({
      target,
      statement,
      resolutions: sanitizeResolutions(body.resolutions),
      source:
        typeof body.source === 'string'
          ? body.source.slice(0, MAX_SOURCE_LENGTH)
          : undefined,
      actor,
    })
    return res.status(200).json({ success: true, data })
  } catch (error: any) {
    if (error instanceof StatementImportError) {
      return res
        .status(error.status)
        .json({ success: false, message: error.message })
    }
    console.error('Statement import error:', error)
    return res
      .status(500)
      .json({ success: false, message: error?.message ?? 'unknown error' })
  }
}
