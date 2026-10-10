import ProfitService from '@common/services/profitService/profit.service'
import Profit from '@modules/models/Profit'
import { canAccessProfitTarget } from '@common/services/profitService/profitAccess'
import { parseProfitPatch } from '@common/services/profitService/profitInput'
import { NextApiRequest, NextApiResponse } from 'next'
import { getCurrentUser } from '@utils/getCurrentUser'

/**
 * @swagger
 * /api/profit/{id}:
 *   get:
 *     tags:
 *       - Profit
 *     summary: Get a profit record by ID
 *     description: Retrieves a single profit record by its ID. Requires admin rights over the record's domain or company (GlobalAdmin: any).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the profit record
 *     responses:
 *       200:
 *         description: Profit record found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Profit'
 *       403:
 *         description: Forbidden - caller does not administer the record's domain or company (or it does not exist)
 *       404:
 *         description: Profit record not found
 *       500:
 *         description: Internal server error
 *
 *   patch:
 *     tags:
 *       - Profit
 *     summary: Update a profit record by ID
 *     description: Updates fields of an existing profit record; unknown fields are ignored, and moving it to another domain/company needs access there too. Requires admin rights over the record's domain or company (GlobalAdmin: any).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the profit record
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Ignored when items are sent - it is their sum
 *               items:
 *                 type: array
 *                 description: Replaces the lines; amount and categories follow them
 *                 items:
 *                   $ref: '#/components/schemas/ProfitItem'
 *               type:
 *                 type: string
 *                 enum: [credit, debit]
 *               categories:
 *                 type: array
 *                 items:
 *                   type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Profit record updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Profit'
 *       403:
 *         description: Forbidden - caller does not administer the record's domain or company (or it does not exist)
 *       500:
 *         description: Internal server error
 *
 *   delete:
 *     tags:
 *       - Profit
 *     summary: Delete a profit record by ID
 *     description: Deletes a profit record. Requires admin rights over the record's domain or company (GlobalAdmin: any).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the profit record
 *     responses:
 *       200:
 *         description: Profit record deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       403:
 *         description: Forbidden - caller does not administer the record's domain or company (or it does not exist)
 *       500:
 *         description: Internal server error
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { isGlobalAdmin, user } = await getCurrentUser(req, res)
  const access = { isGlobalAdmin, user }
  const { id } = req.query

  try {
    // Access follows the ledger the record is filed under, for every role
    // (see canAccessProfitTarget): a DomainAdmin of one domain must not read,
    // edit or delete another domain's records by guessing an id. A record
    // the caller can't reach answers 403 whether or not it exists.
    const existing = await Profit.findById(id).select('domain company').lean()
    if (
      !isGlobalAdmin &&
      !(existing && (await canAccessProfitTarget(existing, access)))
    ) {
      return res.status(403).json({ success: false })
    }

    switch (req.method) {
      case 'GET': {
        const record = await ProfitService.getById(id as string)
        return res.status(200).json({ success: true, data: record })
      }

      case 'PATCH': {
        const { error, update, unset } = parseProfitPatch(req.body)
        if (error)
          return res.status(400).json({ success: false, message: error })

        // Moving a record to another ledger needs access to that one too.
        if (
          (update.domain || update.company) &&
          !(await canAccessProfitTarget(update, access))
        ) {
          return res.status(403).json({ success: false })
        }

        const updated = await ProfitService.update(id as string, update, unset)
        return res.status(200).json({ success: true, data: updated })
      }

      case 'DELETE': {
        await ProfitService.delete(id as string)
        return res.status(200).json({ success: true })
      }

      default:
        return res.status(405).end()
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
