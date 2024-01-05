/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import start, { Data } from '@pages/api/api.config'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  switch (req.method) {
    case 'GET':
      try {
        return res
          .status(400)
          .json({ success: false, message: 'not implemented' })
        // const user = await User.findById(req.query.id).populate('payments')
        // return res.status(200).json({
        //   success: true,
        //   data: { email: user.email, name: user.name, image: user.image },
        // })
      } catch (error) {
        return res.status(400).json({ success: false })
      }
    case 'PATCH':
      // TODO: user should update only himself
      return res.status(400).json({ success: false, message: 'not allowed' })
    // try {
    //   const user = await User.updateOne(
    //     { _id: req.query.id },
    //     {
    //       ...req.body,
    //     }
    //   )
    //   return res.status(200).json({
    //     data: { email: user.email, name: user.name, image: user.image },
    //     success: true,
    //   })
    // } catch (error) {
    //   return res.status(400).json({ success: false })
    // }
  }
}
