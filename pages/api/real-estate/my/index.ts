// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import RealEstate from '@modules/models/RealEstate'
import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'
import { REACT_LOADABLE_MANIFEST } from 'next/dist/shared/lib/constants'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { isGlobalAdmin, user } = await getCurrentUser(req, res)

  if (!isGlobalAdmin) {
    return res
      .status(400)
      .json({ success: false, message: 'not allowed' } as Data)
  }

  switch (req.method) {
    case 'GET':
      try {
        const my = await RealEstate.find({
          adminEmails: { $in: [user.email] },
        })

        return res.status(200).json({ success: true, data: my })
      } catch (error) {
        return res.status(400).json({ success: false })
      }
  }
}
