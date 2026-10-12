import ProfitService, {
  CreateProfitInput,
} from '@common/services/profitService/profit.service'
import RealEstate from '@modules/models/RealEstate'
import { NextApiRequest, NextApiResponse } from 'next'
import { getCurrentUser } from '@utils/getCurrentUser'
import { normalizeCurrency } from '@utils/helpers'
import { normalizeProfitItems } from '@utils/profit-items'

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
 *                 description: Ignored when items are sent - it is their sum
 *               items:
 *                 type: array
 *                 description: Lines of one receipt; categories are derived from them
 *                 items:
 *                   $ref: '#/components/schemas/ProfitItem'
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

  // The list-all overview stays admin-only. POST is more permissive: domain
  // and company are symmetric scopes on the Прибутки page, so a plain User
  // who administers a company (the only way they can reach this at all - see
  // useProfitScopes) may write against that ONE company, checked below once
  // `company` is known. Not an admin and not POST -> nothing to allow.
  if (!isAdmin && req.method !== 'POST') {
    return res.status(403).json({ success: false })
  }

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
          company,
          amount,
          type,
          description,
          date,
          categories,
          items,
          invoiceNumber,
          payment,
          periodMonth,
          currency,
        } = req.body

        // With items the record's amount and categories are theirs - never
        // what the client sent alongside.
        const lines = items === undefined ? null : normalizeProfitItems(items)
        if (lines && !lines.ok) {
          return res.status(400).json({ success: false, error: lines.error })
        }

        // Domain and company are symmetric scopes for a Profit record -
        // exactly one of them, matching whichever ledger the record is
        // filed under (see ProfitService.getLedgerFor).
        if ((!domain && !company) || !(lines || amount) || !type || !date) {
          return res.status(400).json({
            success: false,
            error:
              'Missing required fields: domain or company, amount, type, or date',
          })
        }

        if (domain && company) {
          return res.status(400).json({
            success: false,
            error: 'Provide either domain or company, not both',
          })
        }

        if (!isAdmin) {
          // Only a company scope is reachable this way - domain still
          // requires GlobalAdmin/DomainAdmin, unchanged.
          const owns =
            company &&
            (await RealEstate.exists({ _id: company, adminEmails: user.email }))
          if (!owns) return res.status(403).json({ success: false })
        }

        if (!['debit', 'credit'].includes(type)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid type. Allowed values: "debit" or "credit"',
          })
        }

        const profitDocument: CreateProfitInput = {
          ...(company ? { company } : { domain }),
          createdBy: user._id.toString(),
          amount: lines ? lines.amount : Number(amount),
          type,
          date: new Date(date),
          description: description?.trim() || '',
          categories: lines
            ? lines.categories
            : Array.isArray(categories)
              ? categories
              : [],
          ...(lines ? { items: lines.items } : {}),
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
