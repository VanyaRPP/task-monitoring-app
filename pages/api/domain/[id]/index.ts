import Domain from '@common/modules/models/Domain'
import RealEstate from '@common/modules/models/RealEstate'
import start from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'
start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { isGlobalAdmin, isDomainAdmin, isUser, user } = await getCurrentUser(
    req,
    res
  )

  if (req.method === 'GET') {
    try {
      const { id } = req.query

      const domain = await Domain.findById(id).populate('streets')

      if (!domain) {
        return res.status(404).json({ error: 'not found' })
      }

      if (isGlobalAdmin) {
      } else if (isDomainAdmin) {
        if (!domain.adminEmails.includes(user.email)) {
          return res.status(403).json({ error: 'not allowed' })
        }
      } else if (isUser) {
        const company = await RealEstate.find({
          adminEmails: user.email,
          domain: domain._id,
        })

        if (!company) {
          return res.status(403).json({ error: 'not allowed' })
        }
      }

      return res.status(200).json(domain)
    } catch (error) {
      return res.status(500).json({ error })
    }
  } else if (req.method === 'DELETE') {
    try {
      if (!isGlobalAdmin) {
        return res.status(403).json({ error: 'not allowed' })
      }

      const domain = await Domain.findByIdAndRemove(req.query.id)

      if (!domain) {
        return res.status(404).json({ error: 'not found' })
      }

      // TODO: proper HTTP status
      return res.status(200).json(domain)
    } catch (error) {
      return res.status(500).json({ error })
    }
  } else if (req.method === 'PATCH') {
    try {
      if (!isGlobalAdmin) {
        return res.status(403).json({ error: 'not allowed' })
      }

      const domain = await Domain.findByIdAndUpdate(req.query.id, req.body, {
        new: true,
      })

      if (!domain) {
        return res.status(404).json({ error: 'not found' })
      }

      // TODO: proper HTTP status
      return res.status(200).json(domain)
    } catch (error) {
      return res.status(500).json({ error })
    }
  }
}
