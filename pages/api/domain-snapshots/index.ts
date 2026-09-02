import Domain from '@modules/models/Domain'
import DomainTypeTemplate from '@modules/models/domain-type-template'
import DomainCustomServicesSnapshot, {
  DOMAIN_SNAPSHOT_REASONS,
  DomainSnapshotReason,
} from '@modules/models/domain-custom-services-snapshot'
import { Data } from '@pages/api/api.config'
import { withErrorHandler } from '@utils/api-handler'
import { getCurrentUser } from '@utils/getCurrentUser'
import mongoose from 'mongoose'
import type { NextApiRequest, NextApiResponse } from 'next'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

function parseReason(raw: unknown): DomainSnapshotReason {
  const v = String(raw ?? '').trim() as DomainSnapshotReason
  return DOMAIN_SNAPSHOT_REASONS.includes(v) ? v : 'manual'
}

interface IGroupInput {
  groupName?: unknown
  services?: unknown
}

function parseGroupsInput(raw: unknown): {
  groups: { groupName: string; services: string[] }[]
  error?: string
} {
  if (!Array.isArray(raw)) return { groups: [], error: 'groups must be array' }
  const out: { groupName: string; services: string[] }[] = []
  for (const g of raw as IGroupInput[]) {
    const groupName = String(g?.groupName ?? '').trim()
    if (!groupName) {
      return { groups: [], error: 'each group needs a non-empty groupName' }
    }
    const services = Array.isArray(g?.services)
      ? (g.services as unknown[]).map((s) => String(s)).filter(Boolean)
      : []
    out.push({ groupName, services })
  }
  return { groups: out }
}

async function domainSnapshotsHandler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { isAdmin, user } = await getCurrentUser(req, res)
  if (!isAdmin) {
    return res.status(403).json({ success: false, message: 'Немає доступу' })
  }

  switch (req.method) {
    case 'GET': {
      const domainId = String(req.query.domainId ?? '')
      if (!mongoose.Types.ObjectId.isValid(domainId)) {
        return res
          .status(400)
          .json({ success: false, message: 'invalid domainId' })
      }

      const rawLimit = Number(req.query.limit ?? DEFAULT_LIMIT)
      const limit = Math.min(
        Math.max(Number.isFinite(rawLimit) ? rawLimit : DEFAULT_LIMIT, 1),
        MAX_LIMIT
      )

      const list = await DomainCustomServicesSnapshot.find({ domainId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean()
      return res.status(200).json({ success: true, data: list })
    }

    case 'POST': {
      const domainId = String(req.body?.domainId ?? '')
      if (!mongoose.Types.ObjectId.isValid(domainId)) {
        return res
          .status(400)
          .json({ success: false, message: 'invalid domainId' })
      }

      const domain = await Domain.findById(domainId).lean()
      if (!domain) {
        return res
          .status(404)
          .json({ success: false, message: 'Domain not found' })
      }

      // Snapshot may be triggered before form changes are saved to DB. The
      // caller (FE) can therefore pass the in-flight `groups` and
      // `templateId` it is about to overwrite. If absent, fall back to
      // whatever is currently persisted on the domain.
      const hasExplicitGroups = req.body?.groups !== undefined
      let groups: { groupName: string; services: string[] }[]
      if (hasExplicitGroups) {
        const parsed = parseGroupsInput(req.body.groups)
        if (parsed.error) {
          return res.status(400).json({ success: false, message: parsed.error })
        }
        groups = parsed.groups
      } else {
        groups = (domain.customServices ?? []).map((g: any) => ({
          groupName: g?.groupName ?? '',
          services: (g?.services ?? []).map(String),
        }))
      }

      const isEmpty =
        groups.length === 0 ||
        groups.every(
          (g) => (g.groupName ?? '').trim() === '' && g.services.length === 0
        )
      if (isEmpty) {
        return res.status(400).json({
          success: false,
          message: 'Немає чого зберігати: порожні налаштування',
        })
      }

      const rawTemplateId = req.body?.templateId
      let templateId: mongoose.Types.ObjectId | null = null
      if (rawTemplateId === null) {
        templateId = null
      } else if (typeof rawTemplateId === 'string' && rawTemplateId) {
        if (!mongoose.Types.ObjectId.isValid(rawTemplateId)) {
          return res
            .status(400)
            .json({ success: false, message: 'invalid templateId' })
        }
        templateId = new mongoose.Types.ObjectId(rawTemplateId)
      } else {
        templateId =
          (domain.domainTypeTemplateId as mongoose.Types.ObjectId) ?? null
      }

      let templateName: string | null = null
      if (typeof req.body?.templateName === 'string') {
        templateName = req.body.templateName.trim() || null
      } else if (templateId) {
        const tpl = await DomainTypeTemplate.findById(templateId)
          .select('name')
          .lean()
        templateName = tpl?.name ?? null
      }

      const created = await DomainCustomServicesSnapshot.create({
        domainId,
        templateId,
        templateName,
        groups,
        reason: parseReason(req.body?.reason),
        createdBy: user?._id ?? null,
      })

      return res.status(201).json({ success: true, data: created })
    }

    default:
      return res
        .status(405)
        .json({ success: false, message: `Метод ${req.method} не дозволений` })
  }
}

export default withErrorHandler(domainSnapshotsHandler)
