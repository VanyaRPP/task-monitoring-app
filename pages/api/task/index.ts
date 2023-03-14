/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import Task from 'common/modules/models/Task'
import start, { Data } from 'pages/api/api.config'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  switch (req.method) {
    case 'GET':
      try {
        const tasks = await Task.find({})
        return res.status(200).json({ success: true, data: tasks })
      } catch (error) {
        return res.status(400).json({ success: false })
      }
    case 'POST':
      try {
        const task = await Task.create(req.body)
        return res.status(201).json({ success: true, data: task })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
  }
}
