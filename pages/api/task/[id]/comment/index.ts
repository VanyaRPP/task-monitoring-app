/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import Task from '@modules/models/Task'
import start, { Data } from '@pages/api/api.config'
import type { NextApiRequest, NextApiResponse } from 'next'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  switch (req.method) {
    case 'PATCH':
      try {
        await Task.findById(req.query.id).then(async (task) => {
          const updatedTask = await Task.findOneAndUpdate(
            { _id: task._id },
            {
              comment: [...(task.comment ?? []), ...req.body?.comment],
            }
          )
          return res.status(200).json({ success: true, data: updatedTask })
        })
      } catch (error) {
        return res.status(400).json({ success: false, data: error.message })
      }
      break
    case 'DELETE':
      try {
        await Task.findById(req.query.id).then(async (task) => {
          const updatedTask = await Task.updateOne(
            { _id: req.query.id },
            {
              comment: task.comment.filter(
                (comm) => comm.id !== req.query.comment
              ),
            }
          )
          return res.status(200).json({ success: true, data: updatedTask })
        })
      } catch (error) {
        return res.status(400).json({ success: false, data: error.message })
      }
  }
}
