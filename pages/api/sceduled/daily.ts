/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import Task, { ITask } from '@modules/models/Task'
import { TaskStatuses } from '@utils/constants'
import dayjs from 'dayjs'
import type { NextApiRequest, NextApiResponse } from 'next'
import start from '../api.config'

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
          if (
            dayjs(task?.deadline).isBefore(Date.now()) &&
            task?.status !== TaskStatuses.EXPIRED
          ) {
            await Task.findOneAndUpdate(
              { _id: task._id },
              {
                status: TaskStatuses.EXPIRED,
              }
            )
          }
          if (dayjs(task?.deadline).add(3, 'days').isBefore(Date.now())) {
            await Task.findOneAndUpdate(
              { _id: task._id },
              {
                status: TaskStatuses.ARCHIVED,
              }
            )
          }
        }
      })
      return res.status(201).json({
        success: true,
        data: 'task statuses update to EXPIRED/ARCHIVED',
      })
    })
  } catch (err) {
    return res.status(500)
  }
}
