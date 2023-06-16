// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import start, { Data } from 'pages/api/api.config'
import RealEstate from '@common/modules/models/RealEstate'
import { getCurrentUser } from '@utils/getCurrentUser'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { isGlobalAdmin } = await getCurrentUser(req, res)

  if (!isGlobalAdmin) {
    return res.status(400).json({ success: false, message: 'not allowed' })
  }

  switch (req.method) {
    case 'GET':
      try {
        const options = {}
        const { domainId, streetId } = req.query
        if (domainId && streetId) {
          options.domain = domainId
          options.street = streetId
        }
        const realEstates = await RealEstate.find(options)
          .sort({ data: -1 })
          .limit(req.query.limit)
          .populate({ path: 'domain', select: '_id name' })
          .populate({ path: 'street', select: '_id address city' })

        return res.status(200).json({
          success: true,
          data: realEstates,
        })
      } catch (error) {
        return res.status(400).json({ success: false, message: error })
      }

    case 'POST':
      try {
        // TODO: body validation
        const realEstate = await RealEstate.create(req.body)
        return res.status(200).json({ success: true, data: realEstate })
      } catch (error) {
        return res.status(400).json({ success: false, message: error })
      }
  }
}
