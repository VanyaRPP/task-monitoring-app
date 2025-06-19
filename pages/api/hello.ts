import type { NextApiRequest, NextApiResponse } from 'next'

/**
 * @swagger
 * /api/hello:
 *   get:
 *     description: Returns the hello world
 *     responses:
 *       200:
 *         description: hello world
 */
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ result: 'hello world' })
}
