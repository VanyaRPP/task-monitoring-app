import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from 'utils/dbConnect'
import User from 'common/modules/models/User'

type Data = {
  data?: any
  success: boolean
  error?: any
}

async function start() {
  await dbConnect()
}
start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  switch (req.method) {
    case 'GET':
      try {
        /**
         * @swagger
         * /api/user/id/[id]:
         *   get:
         *     summary: Returns the one User by ID
         *     tags: [User]
         *     responses:
         *       201:
         *         description: The User
         *         content:
         *           application/json:
         *             schema:
         *               type: array
         *               items:
         *                 $ref: '#/components/schemas/Task'
         */
        const user = await User.findById(req.query.id)
        return res.status(201).json({ success: true, data: user })
      } catch (error) {
        return res.status(400).json({ success: false })
      }
    case 'PATCH':
      try {
        const user = await User.findByIdAndUpdate(req.query.id, {
          feedback: req.body.feedback,
        })
        return res.status(400).json({ success: true, data: user })
      } catch (error) {
        return res.status(400).json({ success: false, data: error.message })
      }
  }
}
