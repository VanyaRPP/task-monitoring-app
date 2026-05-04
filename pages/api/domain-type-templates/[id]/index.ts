import Domain from '@modules/models/Domain'
import DomainTypeTemplate, {
  DOMAIN_TYPE_TEMPLATE_CATEGORIES,
  DomainTypeTemplateCategory,
} from '@modules/models/domain-type-template'
import start, { Data } from '@pages/api/api.config'
import { withErrorHandler } from '@utils/api-handler'
import { getCurrentUser } from '@utils/getCurrentUser'
import mongoose from 'mongoose'
import type { NextApiRequest, NextApiResponse } from 'next'

start()

interface IGroupInput {
  groupName: unknown
  serviceIds?: unknown
}

function parseGroups(raw: unknown): {
  groups: { groupName: string; serviceIds: mongoose.Types.ObjectId[] }[]
  error?: string
} {
  if (!Array.isArray(raw)) {
    return { groups: [], error: 'groups must be an array' }
  }
  const groups: {
    groupName: string
    serviceIds: mongoose.Types.ObjectId[]
  }[] = []
  for (const g of raw as IGroupInput[]) {
    const groupName = String(g?.groupName ?? '').trim()
    if (!groupName) {
      return { groups: [], error: 'groupName is required for every group' }
    }
    const ids = Array.isArray(g?.serviceIds) ? g.serviceIds : []
    const serviceIds: mongoose.Types.ObjectId[] = []
    for (const id of ids) {
      const s = String(id ?? '').trim()
      if (!mongoose.Types.ObjectId.isValid(s)) {
        return { groups: [], error: `invalid serviceId: ${s}` }
      }
      serviceIds.push(new mongoose.Types.ObjectId(s))
    }
    groups.push({ groupName, serviceIds })
  }
  return { groups }
}

function parseCategory(raw: unknown): DomainTypeTemplateCategory | null {
  if (raw === undefined) return null
  const v = String(raw).trim() as DomainTypeTemplateCategory
  return DOMAIN_TYPE_TEMPLATE_CATEGORIES.includes(v) ? v : null
}

async function templateByIdHandler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { isAdmin } = await getCurrentUser(req, res)

  const id = String(req.query.id ?? '')
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'invalid id' })
  }

  if (!isAdmin) {
    return res.status(403).json({ success: false, message: 'Немає доступу' })
  }

  const template = await DomainTypeTemplate.findById(id)
  if (!template) {
    return res.status(404).json({ success: false, message: 'not found' })
  }

  switch (req.method) {
    case 'GET': {
      const usageCount = await Domain.countDocuments({
        domainTypeTemplateId: id,
      })
      return res
        .status(200)
        .json({ success: true, data: { ...template.toObject(), usageCount } })
    }

    case 'PATCH': {
      if (template.isBuiltIn) {
        return res.status(403).json({
          success: false,
          message: 'Built-in шаблон не можна редагувати',
        })
      }

      if (typeof req.body?.name === 'string') {
        const name = req.body.name.trim()
        if (!name) {
          return res
            .status(400)
            .json({ success: false, message: 'Назва не може бути порожньою' })
        }
        if (name !== template.name) {
          const dup = await DomainTypeTemplate.findOne({
            name,
            _id: { $ne: id },
          }).lean()
          if (dup) {
            return res.status(409).json({
              success: false,
              message: 'Шаблон з такою назвою вже існує',
            })
          }
          template.name = name
        }
      }

      if (req.body?.category !== undefined) {
        const cat = parseCategory(req.body.category)
        if (!cat) {
          return res
            .status(400)
            .json({ success: false, message: 'Невалідна категорія' })
        }
        template.category = cat
      }

      if (req.body?.groups !== undefined) {
        const { groups, error } = parseGroups(req.body.groups)
        if (error) {
          return res.status(400).json({ success: false, message: error })
        }
        template.groups = groups as typeof template.groups
      }

      const saved = await template.save()
      return res.status(200).json({ success: true, data: saved })
    }

    case 'DELETE': {
      if (template.isBuiltIn) {
        return res.status(403).json({
          success: false,
          message: 'Built-in шаблон не можна видалити',
        })
      }

      const usageCount = await Domain.countDocuments({
        domainTypeTemplateId: id,
      })

      const force = req.query.force === 'true'

      if (usageCount > 0 && !force) {
        return res.status(409).json({
          success: false,
          message: `Шаблон використовується (${usageCount}). Архівуйте або передайте force=true.`,
          data: { usageCount },
        })
      }

      // Soft-archive when in use; hard-delete when free.
      if (usageCount > 0 || req.query.archive === 'true') {
        template.archivedAt = new Date()
        await template.save()
        return res
          .status(200)
          .json({ success: true, data: { archived: true, usageCount } })
      }

      await template.deleteOne()
      return res
        .status(200)
        .json({ success: true, data: { deleted: true, usageCount: 0 } })
    }

    default:
      return res
        .status(405)
        .json({ success: false, message: `Метод ${req.method} не дозволений` })
  }
}

export default withErrorHandler(templateByIdHandler)
