import type { NextApiRequest, NextApiResponse } from 'next'
import Task from 'common/modules/models/Task'
import start, { Data } from 'pages/api/api.config'
import { TaskStatuses } from '../../../../../utils/constants'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  switch (req.method) {
    case 'PATCH':
      try {
        const task = await Task.findById(req.query.id)
        const Utask = await Task.findOneAndUpdate(
          { _id: task._id },
          {
            taskexecutors: [...task.taskexecutors, req.body],
            status: TaskStatuses.PENDING_SELECTION,
          }
        )
        return res.status(200).json({ success: true, data: Utask })
      } catch (error) {
        return res.status(400).json({ success: false })
      }
    case 'DELETE':
      try {
        await Task.findByIdAndRemove(req.query.id).then((user) => {
          if (!user) {
            return res
              .status(400)
              .json({ success: false, data: req.query.id + ' was not found' })
          } else {
            return res
              .status(200)
              .json({ success: true, data: req.query.id + ' was dell' })
          }
        })
      } catch (error) {
        return res
          .status(400)
          .json({ success: false, data: req.query.id + ' error' })
      }
  }
}
