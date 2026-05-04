import DomainCustomServicesSnapshot from '@modules/models/domain-custom-services-snapshot'
import start, { Data } from '@pages/api/api.config'
import { withErrorHandler } from '@utils/api-handler'
import { getCurrentUser } from '@utils/getCurrentUser'
import mongoose from 'mongoose'
import type { NextApiRequest, NextApiResponse } from 'next'

start()

async function domainSnapshotByIdHandler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { isAdmin } = await getCurrentUser(req, res)
  if (!isAdmin) {
    return res.status(403).json({ success: false, message: 'Немає доступу' })
  }

  const id = String(req.query.id ?? '')
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'invalid id' })
  }

  switch (req.method) {
    case 'GET': {
      const snapshot = await DomainCustomServicesSnapshot.findById(id).lean()
      if (!snapshot) {
        return res.status(404).json({ success: false, message: 'not found' })
      }
      return res.status(200).json({ success: true, data: snapshot })
    }

    case 'DELETE': {
      const result = await DomainCustomServicesSnapshot.findByIdAndDelete(id)
      if (!result) {
        return res.status(404).json({ success: false, message: 'not found' })
      }
      return res.status(200).json({ success: true, data: { deleted: true } })
    }

    default:
      return res
        .status(405)
        .json({ success: false, message: `Метод ${req.method} не дозволений` })
  }
}

export default withErrorHandler(domainSnapshotByIdHandler)
