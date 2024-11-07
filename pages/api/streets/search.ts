import Street from '@modules/models/Street'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case 'GET':
      try {
        const { city, address } = req.query

        if (!city || !address) {
          return res
            .status(400)
            .json({ success: false, message: 'City and address are required' })
        }
        const streets = await Street.find({
          city: new RegExp(city as string, 'i'),
          address: new RegExp(address as string, 'i'),
        }).limit(10)

        return res.status(200).json({ success: true, data: streets })
      } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error' })
      }

    default:
      return res
        .status(405)
        .json({ success: false, message: 'Method not allowed' })
  }
}
