/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import User from 'common/modules/models/User'
import start, { Data } from 'pages/api/api.config'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  switch (req.method) {
    case 'GET':
      try {
        const users = await User.find({}).populate('payments')
        return res.status(200).json({ success: true, data: users })
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
