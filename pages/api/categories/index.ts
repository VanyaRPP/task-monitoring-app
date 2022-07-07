import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '../../../utils/dbConnect'
import Category from '../../../models/Category'

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
        const categories = await Category.find({})
        return res.status(201).json({ success: true, data: categories })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
    case 'POST':
      try {
        console.log(req.body.name)

        await Category.create(req.body)
          .then((category) => {
            return res.status(201).json({ success: true, data: category })
          })
          .catch((error) => {
            throw error + 'Blya'
          })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
  }
}
