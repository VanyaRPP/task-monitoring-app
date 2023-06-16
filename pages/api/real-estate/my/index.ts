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
  const { isAdmin, user } = await getCurrentUser(req, res)

  if (!isAdmin) {
    return res
      .status(400)
      .json({ success: false, message: 'not allowed' } as Data)
  }

  switch (req.method) {
    case 'GET':
      try {
        const my = await RealEstate.find({ adminEmails: { $in: [user.email] } })

        return res.status(200).json({ success: true, data: my })
      } catch (error) {
        return res.status(400).json({ success: false })
      }
  }
}
