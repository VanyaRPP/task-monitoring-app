import type { NextApiRequest, NextApiResponse } from 'next'
import Task from 'common/modules/models/Task'
import start from "../api.config"

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

  try {
    Task.find({})
      .then((task) => {
        // console.log(task);
      })
  } catch (err) {
    res.status(500)
  }
}