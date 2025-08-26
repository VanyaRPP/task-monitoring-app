import FeatureFlagService from '@common/services/FeatureFlagServices'
import { getCurrentUser } from '@utils/getCurrentUser'
import { NextApiRequest, NextApiResponse } from 'next'

/**
 * @swagger
 * /api/feature-flags/{id}:
 *   patch:
 *     tags:
 *       - FeatureFlag
 *     summary: Update a feature flag by ID
 *     description: Updates properties of a feature flag. Requires global admin access.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the feature flag to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Unique name of the feature flag
 *               description:
 *                 type: string
 *                 description: Optional description
 *               isEnabled:
 *                 type: boolean
 *                 description: Whether the feature flag is enabled
 *     responses:
 *       200:
 *         description: Feature flag updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/FeatureFlag'
 *       403:
 *         description: Forbidden - Not a global admin
 *       404:
 *         description: Feature flag not found
 *       405:
 *         description: Method Not Allowed
 *       500:
 *         description: Internal server error
 *
 *   delete:
 *     tags:
 *       - FeatureFlag
 *     summary: Delete a feature flag by ID
 *     description: Deletes a feature flag. Requires global admin access.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the feature flag to delete
 *     responses:
 *       200:
 *         description: Feature flag deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       403:
 *         description: Forbidden - Not a global admin
 *       404:
 *         description: Feature flag not found
 *       405:
 *         description: Method Not Allowed
 *       500:
 *         description: Internal server error
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { isGlobalAdmin } = await getCurrentUser(req, res)
  if (!isGlobalAdmin) return res.status(403).json({ success: false })

  const id = req.query.id as string

  try {
    switch (req.method) {
      case 'PATCH': {
        const updated = await FeatureFlagService.update(id, req.body)
        return res.status(200).json({ success: true, data: updated })
      }
      case 'DELETE': {
        await FeatureFlagService.delete(id)
        return res.status(200).json({ success: true })
      }

      default:
        return res.status(405).end()
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}
