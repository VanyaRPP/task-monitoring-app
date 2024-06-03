import Street from '@common/modules/models/Street'
import start from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'
start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { isGlobalAdmin, isDomainAdmin } = await getCurrentUser(req, res)

  if (req.method === 'GET') {
    try {
      if (!isGlobalAdmin && !isDomainAdmin) {
        return res.status(403).send('access restricted')
      }

      const street = await Street.findById(req.query.id)

      if (!street) {
        return res.status(404).send('street not found')
      }

      return res.status(200).json(street)
    } catch (error) {
      return res.status(500).send(error)
    }
  } else if (req.method === 'PATCH') {
    try {
      if (!isGlobalAdmin) {
        return res.status(403).send('access restricted')
      }

      const street = await Street.findByIdAndUpdate(req.query.id, req.body)

      if (!street) {
        return res.status(404).send('street not found')
      }

      return res.status(200).json(street)
    } catch (error) {
      return res.status(500).send(error)
    }
  } else if (req.method === 'DELETE') {
    try {
      const street = await Street.findByIdAndRemove(req.query.id)

      if (!street) {
        return res.status(404).send('street not found')
      }

      return res.status(200).json(street)
    } catch (error) {
      return res.status(500).send(error)
    }
  }
}
