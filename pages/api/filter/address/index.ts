/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import Payment from '@modules/models/Payment'
import start from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'
import {getStreetsPipeline} from "@utils/pipelines";
import {getFilterForAddress} from "@utils/helpers";

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { isGlobalAdmin, user } = await getCurrentUser(req, res)

  if (req.method === 'GET') {
    try {
      const streetsPipeline = getStreetsPipeline(isGlobalAdmin, null)
      const streets = await Payment.aggregate(streetsPipeline)
      const addressFilter = getFilterForAddress(streets)

      return res.status(200).json({ addressFilter, success: true })
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message })
    }
  } else {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }
}
