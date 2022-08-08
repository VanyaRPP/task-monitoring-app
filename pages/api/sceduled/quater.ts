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
        if (
          task?.status !== TaskStatuses.IN_WORK &&
          task?.status !== TaskStatuses.COMPLETED &&
          task?.status !== TaskStatuses.ARCHIVED
        ) {
          if (moment(task?.deadline).isBefore(Date.now()) && task?.status !== TaskStatuses.EXPIRED) {
            await Task.findOneAndUpdate(
              { _id: task._id },
              {
                status: TaskStatuses.EXPIRED,
              }
            )
          }
          if (moment(task?.deadline).add(3, 'days').isBefore(Date.now())) {
            await Task.findOneAndUpdate(
              { _id: task._id },
              {
                status: TaskStatuses.ARCHIVED,
              }
            )
          }
        }
      })
      return res
        .status(201)
        .json({ success: true, data: 'task statuses update to EXPIRED/ARCHIVED' })
    })
  } catch (err) {
    return res.status(500)
  }
}
