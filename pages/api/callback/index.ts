/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import start, { Data } from '@pages/api/api.config'
import CallBack from '../../../common/modules/models/Callback'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  switch (req.method) {
    case 'GET':
      try {
        const callback = await CallBack.find({})
        return res.status(200).json({ success: true, data: callback })
      } catch (error) {
        return res.status(400).json({ success: false })
      }
    case 'POST':
      try {
        const callback = await CallBack.create(req.body)

        return res.status(201).json({ success: true, data: callback })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
  }
}
