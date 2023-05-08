/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import Notification from '@common/modules/models/Notification'
import type { NextApiRequest, NextApiResponse } from 'next'
import start, { Data } from '../../api.config'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { id } = req.query
  switch (req.method) {
    case 'DELETE':
      try {
        const { type } = req.body
        if (type) {
          await Notification.deleteOne({ _id: id })

          return res.status(200).json({ success: true })
        } else {
          await Notification.deleteMany({ userId: id })

          return res.status(200).json({ success: true })
        }
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
    case 'PATCH':
      try {
        const { isSeen, type } = req.body
        if (type) {
          await Notification.updateOne({ _id: id }, { isSeen })

          return res.status(200).json({ success: true })
        } else {
          const notifications = await Notification.updateMany(
            { userId: id },
            { isSeen }
          )

          return res.status(200).json({ success: true, data: notifications })
        }
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
    case 'GET':
      try {
        const notifications = await Notification.find({ userId: id })
        return res.status(200).json({ success: true, data: notifications })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
  }
}
