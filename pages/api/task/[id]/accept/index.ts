import type { NextApiResponse, NextApiRequest } from 'next'
import dbConnect from 'utils/dbConnect'
import { TaskStatuses } from 'utils/constants'
import Task from 'common/modules/models/Task'

interface IData {
  data?: any
  success: boolean
  error?: string
}

async function start() {
  await dbConnect()
}

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<IData>
) {
  switch (req.method) {
    case 'PATCH':
      try {
        const task = await Task.findByIdAndUpdate(req.query.id, {
          executant: req.query.executant,
          status: TaskStatuses.IN_WORK,
        })

        res.status(200).json({ success: true, data: task })
      } catch (error) {
        res.status(400).json({ success: false, error: error.message })
      }
  }
}
