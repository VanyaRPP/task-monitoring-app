import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from 'utils/dbConnect'
import User from 'common/modules/models/User'

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
    case 'PATCH':
      try {
        await User.findById(req.query.id).then(async (user) => {
          const updatedUser = await User.findOneAndUpdate(
            { _id: user._id },
            {
              comment: [...(user.comment ?? []), ...req.body?.comment],
            }
          )
          return res.status(201).json({ success: true, data: updatedUser })
        })
      } catch (error) {
        return res.status(400).json({ success: false, data: error.message })
      }
      break
    case 'DELETE':
      try {
        console.log('query', req.query)
        await User.findById(req.query.id).then(async (user) => {
          const updatedUser = await User.updateOne(
            { _id: req.query.id },
            {
              comment: user.comment.filter(
                (comm) => comm.id !== req.query.comment
              ),
            }
          )
          return res.status(400).json({ success: true, data: updatedUser })
        })
      } catch (error) {
        return res.status(400).json({ success: false, data: error.message })
      }
  }
}
