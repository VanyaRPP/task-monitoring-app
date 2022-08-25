import type { NextApiRequest, NextApiResponse } from 'next'
import Category from 'common/modules/models/Category'
import start, { Data } from 'pages/api/api.config'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  switch (req.method) {
    case 'GET':
      try {
        const categories = await Category.find({})
        return res.status(200).json({ success: true, data: categories })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
    case 'POST':
      try {
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
