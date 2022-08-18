import Notification from '@common/modules/models/Notification'
import type { NextApiRequest, NextApiResponse } from 'next'
import start, { Data } from '../../api.config'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  switch (req.method) {
    case 'GET':
      try {
        const notification = await Notification.findById(req.query.id)
        return res.status(200).json({ success: true, error: notification })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
  }
}
