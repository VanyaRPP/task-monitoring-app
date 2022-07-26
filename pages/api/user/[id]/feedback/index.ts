import type { NextApiRequest, NextApiResponse } from 'next'
import User from 'common/modules/models/User'
import start, { Data } from 'pages/api/api.config'

start()

function averageNum(arr, keyName) {
  return arr.reduce((sum, a) => sum + (keyName === undefined ? a : +a[keyName]), 0) / arr.length;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  switch (req.method) {
    case 'PATCH':
      try {
        await User.findById(req.query.id).then(async (user) => {
          const rating = averageNum(user?.feedback, 'grade')
          const updatedUser = await User.findOneAndUpdate(
            { _id: user._id },
            {
              feedback: [...(user.feedback ?? []), ...req.body?.feedback],
              rating: rating,
            }
          )
          return res.status(201).json({ success: true, data: updatedUser })
        })
      } catch (error) {
        return res.status(400).json({ success: false, data: error.message })
      }
      break
  }
}
