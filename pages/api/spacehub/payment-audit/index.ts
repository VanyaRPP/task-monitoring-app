import mongoose from 'mongoose'
import type { NextApiRequest, NextApiResponse } from 'next'
import start from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import PaymentChangeLog from '@common/modules/models/PaymentChangeLog'
import Domain from '@modules/models/Domain'
import RealEstate from '@common/modules/models/RealEstate'

start()

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

/** Parse a comma-separated string or repeated query param into a clean array. */
const toArray = (value?: string | string[]): string[] | undefined => {
  if (value === undefined) return undefined
  const arr = Array.isArray(value) ? value : String(value).split(',')
  const cleaned = arr.map((v) => v.trim()).filter(Boolean)
  return cleaned.length ? cleaned : undefined
}

/** Escape user input before embedding it in a RegExp (avoids ReDoS / injection). */
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const firstString = (value?: string | string[]): string | undefined =>
  Array.isArray(value) ? value[0] : value

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res
      .status(405)
      .json({ success: false, message: 'Method not allowed' })
  }

  let perms: Awaited<ReturnType<typeof getCurrentUser>>
  try {
    perms = await getCurrentUser(req, res)
  } catch (error: any) {
    return res
      .status(401)
      .json({ success: false, message: error?.message ?? 'unauthorized' })
  }
  const { isGlobalAdmin, isDomainAdmin, user } = perms

  if (!isGlobalAdmin && !isDomainAdmin) {
    return res.status(403).json({ success: false, message: 'not allowed' })
  }

  // Pagination (with defaults and an upper bound on page size).
  const page = Math.max(1, parseInt(firstString(req.query.page) ?? '', 10) || DEFAULT_PAGE)
  const limitRaw = parseInt(firstString(req.query.limit) ?? '', 10) || DEFAULT_LIMIT
  const limit = Math.min(Math.max(1, limitRaw), MAX_LIMIT)
  const skip = (page - 1) * limit

  const query: Record<string, any> = {}

  // Case-insensitive partial match on the actor's email.
  const actorEmail = firstString(req.query.actorEmail)
  if (actorEmail) {
    query.actorEmail = { $regex: escapeRegex(actorEmail), $options: 'i' }
  }

  const actionType = toArray(req.query.actionType)
  if (actionType) {
    query.actionType = { $in: actionType }
  }

  const source = toArray(req.query.source)
  if (source) {
    query.source = { $in: source }
  }

  // Date range filter on `date`.
  const dateFilter: Record<string, Date> = {}
  const from = firstString(req.query.from)
  if (from) {
    const fromDate = new Date(from)
    if (!isNaN(fromDate.getTime())) dateFilter.$gte = fromDate
  }
  const to = firstString(req.query.to)
  if (to) {
    const toDate = new Date(to)
    if (!isNaN(toDate.getTime())) dateFilter.$lte = toDate
  }
  if (Object.keys(dateFilter).length) {
    query.date = dateFilter
  }

  const requestedDomainId = firstString(req.query.domainId)
  const isValidDomainId =
    !!requestedDomainId && mongoose.Types.ObjectId.isValid(requestedDomainId)

  if (isGlobalAdmin) {
    // Global admin: no scope restriction, honour an explicit domain filter.
    if (isValidDomainId) {
      query.domainId = requestedDomainId
    }
  } else {
    // Domain admin: hard-restrict to the domains they administer. A domainId
    // coming from the UI is honoured only if it is one of those domains.
    const ownedDomains = await Domain.find({ adminEmails: user.email }).select(
      '_id'
    )
    const ownedIds = ownedDomains.map((d: any) => d._id)

    const narrowToOwned =
      isValidDomainId &&
      ownedIds.some((id: any) => id.toString() === requestedDomainId)

    query.domainId = narrowToOwned ? requestedDomainId : { $in: ownedIds }
  }

  try {
    const [data, total] = await Promise.all([
      PaymentChangeLog.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PaymentChangeLog.countDocuments(query),
    ])

    // Resolve a human-readable domain name for each entry (only for the ids on
    // this page). Falls back to the snapshot domain for legacy entries.
    const domainIdOf = (log: any): string | null => {
      const candidate =
        log.domainId ?? log.before?.domain ?? log.after?.domain
      if (!candidate) return null
      if (typeof candidate === 'object' && candidate._id) {
        return candidate._id.toString()
      }
      return candidate.toString()
    }

    const ids = Array.from(
      new Set(data.map((log: any) => domainIdOf(log)).filter(Boolean))
    )
    if (ids.length) {
      const domainDocs = await Domain.find({ _id: { $in: ids } }).select('name')
      const nameById = new Map(
        domainDocs.map((d: any) => [d._id.toString(), d.name])
      )
      data.forEach((log: any) => {
        const id = domainIdOf(log)
        if (id) log.domainName = nameById.get(id)
      })
    }

    const companyIdOf = (log: any): string | null => {
      const candidate =
        log.companyId ?? log.before?.company ?? log.after?.company
      if (!candidate) return null
      if (typeof candidate === 'object' && candidate._id) {
        return candidate._id.toString()
      }
      return candidate.toString()
    }

    const companyIds = Array.from(
      new Set(data.map((log: any) => companyIdOf(log)).filter(Boolean))
    )
    if (companyIds.length) {
      const companyDocs = await RealEstate.find({
        _id: { $in: companyIds },
      }).select('companyName')
      const companyNameById = new Map(
        companyDocs.map((d: any) => [d._id.toString(), d.companyName])
      )
      data.forEach((log: any) => {
        const id = companyIdOf(log)
        if (id) log.companyName = companyNameById.get(id)
      })
    }

    return res.status(200).json({ success: true, data, total })
  } catch (error: any) {
    return res
      .status(500)
      .json({ success: false, message: error?.message ?? 'unknown error' })
  }
}
