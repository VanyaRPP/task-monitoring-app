import FeatureFlagService from '@common/services/FeatureFlagServices'
import { getCurrentUser } from '@utils/getCurrentUser'
import { NextApiRequest, NextApiResponse } from 'next'

/**
 * @swagger
 * tags:
 *   - name: FeatureFlag
 *     description: Feature flag management endpoints
 *
 * /api/featureFlags:
 *   get:
 *     tags:
 *       - FeatureFlag
 *     summary: Get all feature flags
 *     description: Returns a list of all feature flags. Requires global admin access.
 *     responses:
 *       200:
 *         description: List of feature flags
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FeatureFlag'
 *       403:
 *         description: Forbidden - Not a global admin
 *       500:
 *         description: Internal server error
 *
 *   post:
 *     tags:
 *       - FeatureFlag
 *     summary: Create a new feature flag
 *     description: Creates a new feature flag. Requires global admin access.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - isEnabled
 *             properties:
 *               name:
 *                 type: string
 *                 description: Unique name for the feature flag
 *               description:
 *                 type: string
 *                 description: Optional description of the feature flag
 *               isEnabled:
 *                 type: boolean
 *                 description: Whether the feature flag is enabled
 *     responses:
 *       200:
 *         description: Feature flag created successfully
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
 *       500:
 *         description: Internal server error
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { isGlobalAdmin } = await getCurrentUser(req, res)
  if (!isGlobalAdmin) return res.status(403).json({ success: false })

  try {
    switch (req.method) {
      case 'GET': {
        const flags = await FeatureFlagService.getAll()
        return res.status(200).json({ success: true, data: flags })
      }

      case 'POST': {
        const { name, description, isEnabled } = req.body
        const flag = await FeatureFlagService.create({
          name,
          description,
          isEnabled,
        })
        res.status(200).json({ success: true, data: flag })
      }

      default:
        return res.status(405).end()
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
