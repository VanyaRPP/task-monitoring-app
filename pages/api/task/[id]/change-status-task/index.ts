import { NextApiResponse, NextApiRequest } from 'next'
import Task from 'common/modules/models/Task'
import start, { Data } from 'pages/api/api.config'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  switch (req.method) {
    case 'PATCH':
      try {
        const task = await Task.findByIdAndUpdate(req.query.id, {
          status: req.body.status,
        })

        res.status(200).json({ success: true, data: task })
      } catch (error) {
        res.status(400).json({ success: false, error: error.message })
      }
  }
}
