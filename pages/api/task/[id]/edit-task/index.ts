/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import Task from '@modules/models/Task'
import start, { Data } from '@pages/api/api.config'
import { NextApiRequest, NextApiResponse } from 'next'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  switch (req.method) {
    case 'PATCH':
      try {
        const task = Task.findByIdAndUpdate(req.query.id, { ...req.body })
        res.status(200).json({ success: true, data: task })
      } catch (error) {
        res.status(400).json({ success: false, error: error.message })
      }
  }
}
