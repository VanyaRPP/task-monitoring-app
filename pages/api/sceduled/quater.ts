import { ITask } from './../../../common/modules/models/Task'
import type { NextApiRequest, NextApiResponse } from 'next'
import Task from 'common/modules/models/Task'
import start from '../api.config'
import moment from 'moment'
import { TaskStatuses } from '../../../utils/constants'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    await Task.find({}).then((tasks) => {
      tasks.map(async (task: ITask) => {
        if (moment(task?.deadline).isBefore(Date.now())) {
          await Task.findOneAndUpdate(
            { _id: task._id },
            {
              status: TaskStatuses.EXPIRED,
            }
          )
        }
      })
      return res
        .status(201)
        .json({ success: true, data: 'task statuses update to EXPIRED' })
    })
  } catch (err) {
    return res.status(500)
  }
}
