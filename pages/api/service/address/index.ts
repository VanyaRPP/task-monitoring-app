/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import Service from '@modules/models/Service'
import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'

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
        const addresses = await Service.find({}).distinct('address')
        return res.status(200).json({ success: true, data: addresses })
      } catch (error) {
        return res.status(400).json({ success: false })
      }
  }
}
