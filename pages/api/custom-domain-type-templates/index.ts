import CustomDomainTypeTemplate from '@modules/models/custom-domain-type-template'
import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import { withErrorHandler } from '@utils/api-handler'
import type { NextApiRequest, NextApiResponse } from 'next'

type ICustomDomainTypeTemplatesHandlerData = Data & {
  duplicate?: boolean
}

start()

async function customDomainTypeTemplatesHandler(
  req: NextApiRequest,
  res: NextApiResponse<ICustomDomainTypeTemplatesHandlerData>
) {
  const { isAdmin } = await getCurrentUser(req, res)

  switch (req.method) {
    case 'GET': {
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Немає доступу',
        })
      }

      const list = await CustomDomainTypeTemplate.find()
        .sort({ typeLabel: 1, groupName: 1 })
        .lean()

      return res.status(200).json({ success: true, data: list })
    }

    case 'POST': {
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Немає доступу',
        })
      }

      const typeLabel = String(req.body?.typeLabel ?? '').trim()
      const groupName = String(req.body?.groupName ?? '').trim()

      if (!typeLabel || !groupName) {
        return res.status(400).json({
          success: false,
          message: 'Потрібні назва типу та назва групи',
        })
      }

      const existing = await CustomDomainTypeTemplate.findOne({
        typeLabel,
        groupName,
      }).lean()

      if (existing) {
        return res.status(200).json({
          success: true,
          data: existing,
          duplicate: true,
        })
      }

      const created = await CustomDomainTypeTemplate.create({
        typeLabel,
        groupName,
      })

      return res.status(201).json({ success: true, data: created })
    }

    default:
      return res.status(405).json({
        success: false,
        message: `Метод ${req.method} не дозволений`,
      })
  }
}

export default withErrorHandler(customDomainTypeTemplatesHandler)
