import ProfitService from '@common/services/profitService/profit.service'
import { NextApiRequest, NextApiResponse } from 'next'
import { getCurrentUser } from '@utils/getCurrentUser'

/**
 * @swagger
 * /api/profit/{id}:
 *   get:
 *     tags:
 *       - Profit
 *     summary: Get a profit record by ID
 *     description: Retrieves a single profit record by its ID. Requires global admin access.
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
 *         description: Forbidden - Not a global admin
 *       404:
 *         description: Profit record not found
 *       500:
 *         description: Internal server error
 *
 *   patch:
 *     tags:
 *       - Profit
 *     summary: Update a profit record by ID
 *     description: Updates fields of an existing profit record. Requires global admin access.
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
 *         description: Forbidden - Not a global admin
 *       500:
 *         description: Internal server error
 *
 *   delete:
 *     tags:
 *       - Profit
 *     summary: Delete a profit record by ID
 *     description: Deletes a profit record. Requires global admin access.
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
 *         description: Forbidden - Not a global admin
 *       500:
 *         description: Internal server error
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { isGlobalAdmin } = await getCurrentUser(req, res)
  if (!isGlobalAdmin) return res.status(403).json({ success: false })

  const { id } = req.query

  try {
    switch (req.method) {
      case 'GET': {
        const record = await ProfitService.getById(id as string)
        return res.status(200).json({ success: true, data: record })
      }

      case 'PATCH': {
        const updated = await ProfitService.update(id as string, req.body)
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
