/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import { authOptions } from '@pages/api/auth/[...nextauth]'
import start, { Data } from 'pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import Domain from '@common/modules/models/Domain'
start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { isAdmin } = await getCurrentUser(req, res)

  if (!isAdmin) {
    return res.status(400).json({ success: false, message: 'not allowed' })
  }

  switch (req.method) {
    case 'DELETE':
      try {
        await Domain.findByIdAndRemove(req.query.id).then((domain) => {
          if (domain) {
            return res.status(200).json({
              success: true,
              data: 'Domain ' + req.query.id + ' was deleted',
            })
          } else {
            return res.status(400).json({
              success: false,
              data: 'Domain ' + req.query.id + ' was not found',
            })
          }
        })
      } catch (error) {
        return res.status(400).json({ success: false, error })
      }
  }
}
