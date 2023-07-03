/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import Domain from 'common/modules/models/Domain'
import start, { Data } from 'pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { isAdmin } = await getCurrentUser(req, res)

  if (!isAdmin) {
    return res.status(400).json({ success: false, message: 'not allowed' })
  }

  switch (req.method) {
    case 'GET':
      try {
        // TODO: filter by user email and this email should be inside amdinEmails
        const domain = await Domain.find({}).populate({
          path: 'streets',
          select: '_id address city',
        })
        return res.status(200).json({ success: true, data: domain })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
    case 'POST':
      try {
        // TODO body validation
        await Domain.create(req.body)
          .then((domain) => {
            return res.status(201).json({ success: true, data: domain })
          })
          .catch((error) => {
            throw error
          })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
  }
}
