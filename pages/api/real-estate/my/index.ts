import RealEstate from '@modules/models/RealEstate'
import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  await start()

  if (req.method !== 'GET') {
    return res
      .status(405)
      .json({ success: false, message: 'Method not allowed' })
  }

  try {
    const { user } = await getCurrentUser(req, res)

    const myCompanies = await RealEstate.find({ adminEmails: user.email })
      .select('companyName domain street archived')
      .sort({ companyName: 1 })
      .lean()

    return res.status(200).json({ success: true, data: myCompanies })
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message })
  }
}
