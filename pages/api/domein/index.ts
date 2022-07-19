import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '../../../utils/dbConnect'
import Domein from '../../../common/modules/models/Domein'

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
        const domein = await Domein.find({})
        return res.status(201).json({ success: true, data: domein })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
    case 'POST':
      try {
        console.log(req.body.name)
        await Domein.create(req.body)
          .then((domein) => {
            return res.status(201).json({ success: true, data: domein })
          })
          .catch((error) => {
            throw error + 'Blya'
          })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
  }
}
