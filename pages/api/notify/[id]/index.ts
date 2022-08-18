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
        const notifications = await Notification.find({ _id: req.query.id })
        return res.status(200).json({ success: true, error: notifications })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
  }
}
