import type { NextApiRequest, NextApiResponse } from 'next'
import User from '../../../common/modules/models/User'
import dbConnect from '../../../utils/dbConnect'

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
        const users = await User.find({})
        return res.status(201).json({ success: true, data: users })
      } catch (error) {
        return res.status(400).json({ success: false })
      }
    // case 'POST':
    //   try {
    //     const task = await Task.create(req.body)
    //     return res.status(201).json({ success: true, data: task })
    //   } catch (error) {
    //     return res.status(400).json({ success: false, error: error })
    //   }
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
