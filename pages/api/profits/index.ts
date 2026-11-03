import ProfitService, {
  CreateProfitInput,
} from '@common/services/profitService/profit.service'
import { canAccessProfitTarget } from '@common/services/profitService/profitAccess'
import { parseProfitBody } from '@common/services/profitService/profitInput'
import { NextApiRequest, NextApiResponse } from 'next'
import { getCurrentUser } from '@utils/getCurrentUser'

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
 *     description: Returns a paginated list of profit records grouped by month, across every domain. GlobalAdmin only.
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
 *         description: Forbidden - Not a global admin
 *       500:
 *         description: Internal server error
 *
 *   post:
 *     tags:
 *       - Profit
 *     summary: Create a new profit record
 *     description: Adds a new profit record to one domain or company ledger. The caller must administer that domain or company (GlobalAdmin: any).
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
 *         description: Forbidden - caller does not administer that domain or company
 *       500:
 *         description: Internal server error
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { isGlobalAdmin, user } = await getCurrentUser(req, res)
  const access = { isGlobalAdmin, user }

  // The list-all overview spans every domain, so it is GlobalAdmin's alone.
  // POST is open to anyone who can reach a ledger: its target is checked
  // against the caller below, once the body says what it is.
  if (!isGlobalAdmin && req.method !== 'POST') {
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
        const { error, input } = parseProfitBody(req.body)
        if (error) return res.status(400).json({ success: false, error })

        // Writing into a ledger needs access to THAT domain or company -
        // being a DomainAdmin somewhere is not enough.
        if (!(await canAccessProfitTarget(input, access))) {
          return res.status(403).json({ success: false })
        }

        const profitDocument: CreateProfitInput = {
          ...input,
          createdBy: user._id.toString(),
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
