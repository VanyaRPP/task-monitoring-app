// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
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
        const categories = await Category.findById(req.query.id)
        return res.status(200).json({ success: true, data: categories })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
    case 'DELETE':
      try {
        await Category.findByIdAndRemove(req.query.id).then((category) => {
          if (!category) {
            return res.status(400).json({
              success: false,
              data: 'Category ' + req.query.id + ' was not found',
            })
          } else {
            return res.status(200).json({
              success: true,
              data: 'Category ' + req.query.id + ' was dell',
            })
          }
        })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
    case 'PATCH':
      try {
        const category = await Category.findByIdAndUpdate(req.query.id, {
          ...req.body,
        })
        return res.status(200).json({ success: true, data: category })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
  }
}
