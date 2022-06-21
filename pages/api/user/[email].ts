import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from "../../../utils/dbConnect"
import User from '../../../models/User'

type Data = {
  name: string,
  data?: any,
  success: boolean,
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
        const user = await User.findOne({ email: req.query.email })
        return res.status(201).json({ success: true, data: user })
      } catch (error) {
        return res.status(400).json({ success: false })
      }
    case 'PATCH':
      try {
        const user = await User.findOneAndUpdate({ email: req.query.email }, { role: req.query.role })
        console.log(req.query);
        
        return res.status(201).json({ success: true, data: user })
      } catch (error) {
        return res.status(400).json({ success: false })
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
