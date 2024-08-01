/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import Notification, { INotification } from '@modules/models/Notification'
import dayjs from 'dayjs'
import type { NextApiRequest, NextApiResponse } from 'next'
import start from '../api.config'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const notifications = await Notification.find({})
    notifications.map(async (notification: INotification) => {
      const dateOfCreating = dayjs(notification.timestamp)
      const currentDay = dayjs(new Date())
      if (dateOfCreating.add(2, 'days').isAfter(currentDay)) {
        await Notification.findOneAndRemove({ _id: notification._id })
      }
    })

    return res.status(201).json({
      success: true,
      data: 'Two days old notifications were deleted.',
    })
  } catch (err) {
    return res.status(500)
  }
}
