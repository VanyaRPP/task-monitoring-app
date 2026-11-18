import type { NextApiRequest, NextApiResponse } from 'next'
import { Data } from '@pages/api/api.config'
import { withErrorHandler } from '@utils/api-handler'
import { canEditDomain } from '@utils/domain/domain-access'
import { getCurrentUser } from '@utils/getCurrentUser'
import {
  DebtTariffsError,
  getBuildingTariffs,
  saveBuildingTariffs,
} from '@common/services/debtTariffsService/debtTariffs.service'

/**
 * @swagger
 * /api/debt-calculation/tariffs:
 *   get:
 *     summary: Tariffs of a provider's buildings for the debt calculation
 *     tags: [DebtCalculation]
 *     parameters:
 *       - in: query
 *         name: domainId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: "`data` - one entry per address: groups, periods" }
 *       401: { description: Not signed in }
 *       403: { description: The user does not administer the domain }
 *   put:
 *     summary: Replaces the tariffs of one address (no periods - removes them)
 *     tags: [DebtCalculation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [domainId, tariffs]
 *             properties:
 *               domainId: { type: string }
 *               tariffs:
 *                 type: object
 *                 description: "{ street?, address?, groups: [{label, apartments}], periods: [{from, to?, tariffs}] }"
 *     responses:
 *       200: { description: "`data` - every address's tariffs after the save" }
 *       400: { description: Bad shape, or an address of another provider }
 *       401: { description: Not signed in }
 *       403: { description: The user does not administer the domain }
 */
async function debtTariffsHandler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'GET' && req.method !== 'PUT') {
    return res
      .status(405)
      .json({ success: false, message: `Метод ${req.method} не дозволений` })
  }

  let access: Awaited<ReturnType<typeof getCurrentUser>>
  try {
    access = await getCurrentUser(req, res)
  } catch {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }
  const domainId = String(
    (req.method === 'GET' ? req.query.domainId : req.body?.domainId) ?? ''
  )
  if (!(await canEditDomain(access, domainId))) {
    return res.status(403).json({ success: false, message: 'Немає доступу' })
  }

  if (req.method === 'GET') {
    return res
      .status(200)
      .json({ success: true, data: await getBuildingTariffs(domainId) })
  }

  try {
    const data = await saveBuildingTariffs(domainId, req.body?.tariffs)
    return res.status(200).json({ success: true, data })
  } catch (error) {
    if (error instanceof DebtTariffsError) {
      return res
        .status(error.status)
        .json({ success: false, message: error.message })
    }
    throw error
  }
}

export default withErrorHandler(debtTariffsHandler)
