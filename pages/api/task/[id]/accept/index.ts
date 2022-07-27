import User from 'common/modules/models/User';
import type { NextApiResponse, NextApiRequest } from 'next'
import { TaskStatuses } from 'utils/constants'
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
          executant: req.query.executant,
          status: TaskStatuses.IN_WORK,
        })
        await User.findById(req.query.executant)
          .then(
            async (user) => await User.findByIdAndUpdate(req.query.executant,
              {
                tasks: [...(user.tasks ?? []), req.query.id]
              }
            )
          )

        res.status(200).json({ success: true, data: task })
      } catch (error) {
        res.status(400).json({ success: false, error: error.message })
      }
  }
}
