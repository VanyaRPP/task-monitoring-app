import type { NextApiRequest, NextApiResponse } from 'next'
import start, { Data } from '@pages/api/api.config'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  switch (req.method) {
    case 'POST':
      try {
        const { domainId, meta, authTag } = req.body

        return res
          .status(201)
          .json({ success: true, data: { domainId, meta, authTag } })
      } catch (error) {
        return res.status(400).json({ success: false, error: error })
      }
  }
}
