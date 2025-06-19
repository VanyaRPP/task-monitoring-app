import ProfitService from '@common/services/profitService/profit.service'
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
  const { isAdmin } = await getCurrentUser(req, res)
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
        const { domain, amount, type, description, date } = req.body

        const record = await ProfitService.create({
          domain,
          amount,
          type,
          categories: [],
          description,
          date,
        })
        return res.status(200).json({ success: true, data: record })
      }

      default:
        return res.status(405).end()
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
