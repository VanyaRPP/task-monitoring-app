import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '../../../utils/dbConnect'
import Task from '../../../models/Task'

type Data = {
  data?: any
  success: boolean
  error?: any
}

async function start() {
  await dbConnect()
}
start()
// /**
//  * @swagger
//  * components:
//  *   schemas:
//  *     Task:
//  *       type: object
//  *       required:
//  *         - name
//  *         - creator
//  *         - deadline
//  *       properties:
//  *         _id:
//  *           type: string
//  *           description: The auto-generated id of the Task
//  *         name:
//  *           type: string
//  *           description: The Task name
//  *         creator:
//  *           type: ObjectId
//  *           description: The id of Task creator
//  *         desription:
//  *            type: string
//  *            description: The Task desription
//  *         deadline:
//  *            type: Date
//  *            description: The Task deadline
//  *         dateofcreate:
//  *            type: Date
//  *            description: The auto-generated dateofcreate of the Task
//  *       example:
//  *         _id: d5fE_aszd5fE_aszd5fE_aszd5fE_asz
//  *         name: The New Turing Omnibus
//  *         creator: 7hdisciush8w9229
//  *         desription: Some Description
//  *         deadline: "1995-12-17T03:24:00"
//  *         dateofcreate: "1994-12-17T03:24:00"
//  */

// /**
//   * @swagger
//   * tags:
//   *   name: Tasks
//   *   description: The Tasks managing API
//   */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  switch (req.method) {
    case 'GET':
      try {
        const categories = await Task.find({})
        return res.status(201).json({ success: true, data: categories })
      } catch (error) {
        return res.status(400).json({ success: false })
      }
    case 'POST':
      try {
        const task = await Task.create(req.body)
        return res.status(201).json({ success: true, data: task })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
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
