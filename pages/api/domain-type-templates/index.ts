import DomainTypeTemplate, {
  DOMAIN_TYPE_TEMPLATE_CATEGORIES,
  DomainTypeTemplateCategory,
} from '@modules/models/domain-type-template'
import { Data } from '@pages/api/api.config'
import { withErrorHandler } from '@utils/api-handler'
import { getCurrentUser } from '@utils/getCurrentUser'
import mongoose from 'mongoose'
import type { NextApiRequest, NextApiResponse } from 'next'

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

function parseCategory(raw: unknown): DomainTypeTemplateCategory {
  const v = String(raw ?? '').trim() as DomainTypeTemplateCategory
  return DOMAIN_TYPE_TEMPLATE_CATEGORIES.includes(v) ? v : 'other'
}

async function domainTypeTemplatesHandler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { isAdmin, user } = await getCurrentUser(req, res)

  switch (req.method) {
    case 'GET': {
      // Read-only catalog of service-type templates. Any authenticated user may
      // read it (e.g. a brand-new user picking a provider type in the invoice
      // quick-create, before they become a DomainAdmin). Mutations stay
      // admin-only below.
      const includeArchived = req.query.includeArchived === 'true'
      const filter = includeArchived ? {} : { archivedAt: null }
      const list = await DomainTypeTemplate.find(filter)
        .sort({ name: 1 })
        .lean()
      return res.status(200).json({ success: true, data: list })
    }

    case 'POST': {
      if (!isAdmin) {
        return res
          .status(403)
          .json({ success: false, message: 'Немає доступу' })
      }

      const name = String(req.body?.name ?? '').trim()
      if (!name) {
        return res
          .status(400)
          .json({ success: false, message: 'Потрібна назва шаблону' })
      }

      const { groups, error } = parseGroups(req.body?.groups ?? [])
      if (error) {
        return res.status(400).json({ success: false, message: error })
      }

      const category = parseCategory(req.body?.category)

      const existing = await DomainTypeTemplate.findOne({ name }).lean()
      if (existing) {
        return res
          .status(409)
          .json({ success: false, message: 'Шаблон з такою назвою вже існує' })
      }

      const created = await DomainTypeTemplate.create({
        name,
        category,
        isBuiltIn: false,
        groups,
        createdBy: user?._id,
      })
      return res.status(201).json({ success: true, data: created })
    }

    default:
      return res
        .status(405)
        .json({ success: false, message: `Метод ${req.method} не дозволений` })
  }
}

export default withErrorHandler(domainTypeTemplatesHandler)
