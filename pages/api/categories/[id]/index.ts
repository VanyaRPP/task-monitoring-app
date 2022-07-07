import type { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '../../../../utils/dbConnect'
import Category from '../../../../models/Category'

type Data = {
  data?: any,
  success: boolean,
  error?: any,
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
        const categories = await Category.findById(req.query.id)
        return res.status(201).json({ success: true, data: categories })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
    case 'DELETE':
      try {
        await Category.findByIdAndRemove(req.query.id)
          .then((category) => {
            if (!category) {
              return res.status(400).json({ success: false, data: 'Category ' + req.query.id + ' was not found' })
            } else {
              return res.status(200).json({ success: true, data: 'Category ' + req.query.id + ' was dell' })
            }
          })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
    case 'PUT':
      try {

      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
  }
}
