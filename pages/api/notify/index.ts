/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import Notification from '@modules/models/Notification'
import type { NextApiRequest, NextApiResponse } from 'next'
import start, { Data } from '../api.config'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  switch (req.method) {
    case 'POST':
      try {
        const { userId, text, url } = req.body
        const notification = await Notification.create({
          userId,
          url,
          text,
        })

        return res.status(201).json({ success: true, data: notification })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
  }
}
