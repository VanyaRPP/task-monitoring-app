import FeatureFlagService from '@common/services/FeatureFlagServices'
import { NextApiRequest, NextApiResponse } from 'next'

/**
 * @swagger
 * /api/feature-flags/by-name/{name}:
 *   get:
 *     tags:
 *       - FeatureFlag
 *     summary: Get a feature flag by name
 *     description: Retrieves a feature flag by its unique name.
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique name of the feature flag
 *     responses:
 *       200:
 *         description: Feature flag found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/FeatureFlag'
 *       404:
 *         description: Feature flag not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Feature flag not found
 *       405:
 *         description: Method not allowed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Method Not Allowed
 *       500:
 *         description: Internal server error
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res
      .status(405)
      .json({ success: false, message: 'Method Not Allowed' })
  }

  try {
    const flag = await FeatureFlagService.getByName(req.query.name as string)
    if (!flag) {
      return res
        .status(404)
        .json({ success: false, message: 'Feature flag not found' })
    }

    return res.status(200).json({ success: true, data: flag })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
