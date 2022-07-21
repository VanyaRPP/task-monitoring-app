import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from 'utils/dbConnect'
import Task from 'common/modules/models/Task'

type Data = {
  data?: any
  success: boolean
  error?: any
}

async function start() {
  await dbConnect()
}
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
          return res.status(201).json({ success: true, data: updatedTask })
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
          return res.status(400).json({ success: true, data: updatedTask })
        })
      } catch (error) {
        return res.status(400).json({ success: false, data: error.message })
      }
  }
}
