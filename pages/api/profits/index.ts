import ProfitService, {
  CreateProfitInput,
} from '@common/services/profitService/profit.service'
import { NextApiRequest, NextApiResponse } from 'next'
import { getCurrentUser } from '@utils/getCurrentUser'
import { normalizeCurrency } from '@utils/helpers'

/**
 * @swagger
 * tags:
 *   - name: Profit
 *     description: Endpoints related to profit records
 *
 * /api/profit:
 *   get:
 *     tags:
 *       - Profit
 *     summary: Get all profit records separated by month
 *     description: Returns a paginated list of profit records grouped by month. Requires admin access.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: A list of grouped profit records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                 meta:
 *                   type: object
 *       403:
 *         description: Forbidden - Not an admin
 *       500:
 *         description: Internal server error
 *
 *   post:
 *     tags:
 *       - Profit
 *     summary: Create a new profit record
 *     description: Adds a new profit record. Requires admin access.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - domain
 *               - amount
 *               - type
 *               - date
 *             properties:
 *               domain:
 *                 type: string
 *                 description: Domain ID (ObjectId)
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [credit, debit]
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Profit record successfully created
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
 *         description: Forbidden - Not an admin
 *       500:
 *         description: Internal server error
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { isAdmin, user } = await getCurrentUser(req, res)
  if (!isAdmin) return res.status(403).json({ success: false })

  try {
    switch (req.method) {
      case 'GET': {
        const { page = '1', limit = '10' } = req.query
        const data = await ProfitService.getAllWithMonthSeparation(
          +page,
          +limit
        )
        return res.status(200).json({ success: true, ...data })
      }

      case 'POST': {
        const {
          domain,
          amount,
          type,
          description,
          date,
          categories,
          invoiceNumber,
          payment,
          periodMonth,
          currency,
        } = req.body

        if (!domain || !amount || !type || !date) {
          return res.status(400).json({
            success: false,
            error: 'Missing required fields: domain, amount, type, or date',
          })
        }

        if (!['debit', 'credit'].includes(type)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid type. Allowed values: "debit" or "credit"',
          })
        }

        const profitDocument: CreateProfitInput = {
          domain,
          createdBy: user._id.toString(),
          amount: Number(amount),
          type,
          date: new Date(date),
          description: description?.trim() || '',
          categories: Array.isArray(categories) ? categories : [],
          invoiceNumber: invoiceNumber?.trim(),
          payment,
          // Optional: the ledger falls back to the month of `date` without it.
          periodMonth: /^\d{4}-\d{2}$/.test(periodMonth ?? '')
            ? periodMonth
            : undefined,
          currency: normalizeCurrency(currency),
        }

        try {
          const record = await ProfitService.create(profitDocument)
          return res.status(200).json({ success: true, data: record })
        } catch (error) {
          // console.error('Error creating profit record:', error)
          return res.status(500).json({
            success: false,
            error: 'Server error while creating profit record',
          })
        }
      }

      default:
        return res.status(405).end()
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
