import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '../../../../utils/dbConnect'
import Task from '../../../../models/Task'

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
      /**
       * @swagger
       * /api/task/[id]:
       *   get:
       *     summary: Returns the one the Task
       *     tags: [Tasks]
       *     responses:
       *       201:
       *         description: The Task
       *         content:
       *           application/json:
       *             schema:
       *               type: array
       *               items:
       *                 $ref: '#/components/schemas/Task'
       */
      try {
        const task = await Task.findById(req.query.id)
        return res.status(201).json({ success: true, data: task })
      } catch (error) {
        return res.status(400).json({ success: false })
      }
    case 'DELETE':
      /**
       * @swagger
       * /api/task/[id]:
       *   delete:
       *     summary: Delete task
       *     tags: [Tasks]
       *     requestBody:
       *       required: true
       *     responses:
       *       200:
       *         description: Delete Task
       *       400:
       *         description: Task not found
       */
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
    // try {
    //   const maybeteam = await User.findOne({ name: req.body.name }).exec()
    //   console.log(req.body.name, '--------', maybeteam)
    //   let team
    //   !maybeteam ? team = await User.create(req.body) : team = await User.updateOne({ name: req.body.name }, { $set: { score: maybeteam.score + 1 } })
    //   return res.status(201).json({ success: true, data: team })
    // } catch (error) {
    //   return res.status(400).json({ success: false })
    // }
  }
}
