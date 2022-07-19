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
    case 'GET':
      try {
        const task = await Task.findById(req.query.id)
        return res.status(201).json({ success: true, data: task })
      } catch (error) {
        return res.status(400).json({ success: false })
      }
    case 'PATCH':
      try {
      } catch (error) {
        return res
          .status(400)
          .json({ success: false, data: req.query.id + ' error' })
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
              .json({ success: true, data: req.query.id + ' was deleted' })
          }
        })
      } catch (error) {
        return res
          .status(400)
          .json({ success: false, data: req.query.id + ' error' })
      }
  }
}
