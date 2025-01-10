import CustomService from '@modules/models/CustomService'
import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import { transliterateAndCamelCase } from '@utils/transliterateAndCamelCase'
import type { NextApiRequest, NextApiResponse } from 'next'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { isGlobalAdmin } = await getCurrentUser(req, res)

  // if (!isGlobalAdmin) {
  //   return res.status(400).json({ success: false, message: 'not allowed' })
  // }

  switch (req.method) {
    case 'POST':
      try {
        const reqBody = {
          name: req.body.name,
          fieldName: transliterateAndCamelCase(req.body.name),
        }
        const customService = await CustomService.create(reqBody)

        return res.status(200).json({
          success: true,
          data: customService,
        })
      } catch (error) {
        return res.status(400).json({ success: false })
      }
  }
}
