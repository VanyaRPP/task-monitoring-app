import Notification from '@common/modules/models/Notification'
import type { NextApiRequest, NextApiResponse } from 'next'
import start, { Data } from '../../api.config'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  switch (req.method) {
    case 'DELETE':
      try {
        const { isSeen, type, id } = req.body
        if (type) {
          await Notification.findOneAndRemove({ _id: id })

          return res.status(201).json({ success: true })
        } else {
          await Notification.remove({ userId: id })

          return res.status(201).json({ success: true })
        }
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
    case 'PATCH':
      try {
        const { isSeen, type, id } = req.body
        if (type) {
          const notification = await Notification.findOneAndUpdate(
            { _id: id },
            { isSeen }
          )

          return res.status(201).json({ success: true, data: notification })
        } else {
          const notifications = await Notification.updateMany(
            { userId: id },
            { isSeen }
          )

          return res.status(201).json({ success: true, data: notifications })
        }
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
    case 'GET':
      try {
        const notifications = await Notification.find({ _id: req.query.id })
        return res.status(200).json({ success: true, error: notifications })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
  }
}
