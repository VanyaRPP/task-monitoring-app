import CustomService from '@modules/models/CustomService'
import Domain from '@modules/models/Domain'
import RealEstate from '@modules/models/RealEstate'
import { DomainTypeTemplateCategory } from '@modules/models/domain-type-template'
import { getDefaultServiceIdsForCategory } from '@common/services/domainTypeTemplateService/domainTypeTemplate.service'
import { ServiceType } from '@utils/constants'
import { escapeRegexForMongo } from '@utils/escape-regex/escape-regex'
import { defaultServicesSet } from '@utils/helpers'
import { transliterateAndCamelCase } from '@utils/transliterateAndCamelCase'
import mongoose from 'mongoose'

const DEFAULT_GROUP_NAME = 'Загальні'

export type ServiceErrorCode =
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'invalid'

export interface ServiceErr {
  ok: false
  code: ServiceErrorCode
  message: string
}

export interface ServiceOk<T> {
  ok: true
  data: T
}

export type ServiceResult<T> = ServiceOk<T> | ServiceErr

export interface UserContext {
  isGlobalAdmin: boolean
  isDomainAdmin: boolean
  isUser: boolean
  user: { email: string }
}

export interface CreateCustomServiceInput {
  name?: unknown
  domainId?: unknown
  serviceType?: unknown
}

export interface UpdateCustomServiceInput {
  name?: unknown
  domainId?: unknown
  serviceType?: unknown
}

export interface DeleteCustomServiceInput {
  domainId?: unknown
}

const SERVICE_TYPE_VALUES = new Set<string>(Object.values(ServiceType))

function ok<T>(data: T): ServiceResult<T> {
  return { ok: true, data }
}

function err(code: ServiceErrorCode, message: string): ServiceErr {
  return { ok: false, code, message }
}

export function isServiceErr<T>(r: ServiceResult<T>): r is ServiceErr {
  return !r.ok
}

function parseServiceTypeInput(raw: unknown): {
  ok: boolean
  value?: ServiceType
} {
  if (raw === undefined || raw === null || raw === '') {
    return { ok: true, value: undefined }
  }
  const v = String(raw)
  if (!SERVICE_TYPE_VALUES.has(v)) return { ok: false }
  return { ok: true, value: v as ServiceType }
}

function parseName(raw: unknown): string | null {
  const trimmed = typeof raw === 'string' ? raw.trim() : raw
  if (typeof trimmed !== 'string' || trimmed.length === 0) return null
  return trimmed
}

function toObjectId(raw: unknown): mongoose.Types.ObjectId | null {
  if (raw === undefined || raw === null || raw === '') return null
  const str = String(raw)
  if (!mongoose.Types.ObjectId.isValid(str)) return null
  return new mongoose.Types.ObjectId(str)
}

/**
 * Resolves the domain the caller is operating in and confirms they may act on it.
 * GlobalAdmin: any valid domain. DomainAdmin: only domains listed in adminEmails.
 */
async function assertDomainAccess(
  rawDomainId: unknown,
  ctx: UserContext
): Promise<ServiceResult<mongoose.Types.ObjectId>> {
  if (!ctx.isGlobalAdmin && !ctx.isDomainAdmin) {
    return err('forbidden', 'Недостатньо прав')
  }
  const domainObjectId = toObjectId(rawDomainId)
  if (!domainObjectId) {
    return err('invalid', 'Не вказано або невалідний domainId')
  }
  if (ctx.isGlobalAdmin) {
    return ok(domainObjectId)
  }
  const allowed = await Domain.exists({
    _id: domainObjectId,
    adminEmails: ctx.user.email,
  })
  if (!allowed) {
    return err('forbidden', 'Ви не є адміністратором цього домену')
  }
  return ok(domainObjectId)
}

async function findDuplicateInDomain(
  name: string,
  domainId: mongoose.Types.ObjectId,
  excludeId?: string | mongoose.Types.ObjectId
) {
  const filter: Record<string, unknown> = {
    name: { $regex: `^${escapeRegexForMongo(name)}$`, $options: 'i' },
    domain: domainId,
  }
  if (excludeId) filter._id = { $ne: excludeId }
  return CustomService.findOne(filter)
}

async function attachServiceToDomainGroup(
  domainId: mongoose.Types.ObjectId,
  serviceId: mongoose.Types.ObjectId
): Promise<void> {
  const domain = await Domain.findById(domainId).select('customServices')
  const existingGroups = domain?.customServices ?? []

  if (existingGroups.length > 0) {
    const firstGroupName = existingGroups[0].groupName
    await Domain.updateOne(
      { _id: domainId, 'customServices.groupName': firstGroupName },
      { $addToSet: { 'customServices.$[group].services': serviceId } },
      { arrayFilters: [{ 'group.groupName': firstGroupName }] }
    )
  } else {
    await Domain.updateOne(
      { _id: domainId },
      {
        $push: {
          customServices: {
            groupName: DEFAULT_GROUP_NAME,
            services: [serviceId],
          },
        },
      }
    )
  }
}

async function detachServiceFromDomainGroups(
  domainId: mongoose.Types.ObjectId,
  serviceId: mongoose.Types.ObjectId | string
): Promise<void> {
  await Domain.updateOne(
    { _id: domainId },
    { $pull: { 'customServices.$[].services': serviceId } }
  )
}

async function detachServiceFromDomainCompanies(
  domainId: mongoose.Types.ObjectId,
  serviceId: mongoose.Types.ObjectId | string
): Promise<void> {
  await RealEstate.updateMany(
    { domain: domainId },
    { $pull: { customServices: { _id: serviceId } } }
  )
}

async function attachServiceToDomainCompanies(
  domainId: mongoose.Types.ObjectId,
  service: {
    _id: mongoose.Types.ObjectId
    name: string
    fieldName: string
  }
): Promise<void> {
  await RealEstate.updateMany(
    { domain: domainId, archived: { $ne: true } },
    {
      $push: {
        customServices: {
          _id: service._id,
          label: service.name,
          fieldName: service.fieldName,
          price: 0,
        },
      },
    }
  )
}

export async function createCustomService(
  input: CreateCustomServiceInput,
  ctx: UserContext
): Promise<ServiceResult<any>> {
  // POST keeps legacy contract: role failure → 400 'Не дозволено' (not 403),
  // and domainId is optional — empty means a global service.
  if (!ctx.isGlobalAdmin && !ctx.isDomainAdmin) {
    return err('invalid', 'Не дозволено')
  }

  const name = parseName(input.name)
  if (!name) {
    return err('invalid', 'Назва послуги не може бути порожньою')
  }

  const parsedType = parseServiceTypeInput(input.serviceType)
  if (!parsedType.ok) {
    return err('invalid', 'Невалідний serviceType')
  }

  let domainObjectId: mongoose.Types.ObjectId | undefined
  if (
    input.domainId !== undefined &&
    input.domainId !== null &&
    input.domainId !== ''
  ) {
    const parsed = toObjectId(input.domainId)
    if (!parsed) {
      return err('invalid', 'Невалідний domainId')
    }
    domainObjectId = parsed
  }

  const uniquenessFilter: Record<string, unknown> = {
    name: { $regex: `^${escapeRegexForMongo(name)}$`, $options: 'i' },
  }
  if (domainObjectId) {
    uniquenessFilter.domain = domainObjectId
  } else {
    uniquenessFilter.$or = [{ domain: null }, { domain: { $exists: false } }]
  }

  const duplicate = await CustomService.findOne(uniquenessFilter)
  if (duplicate) {
    return err('conflict', 'Послуга з такою назвою вже існує')
  }

  const created = await CustomService.create({
    name,
    fieldName: transliterateAndCamelCase(name),
    ...(parsedType.value ? { serviceType: parsedType.value } : {}),
    ...(domainObjectId ? { domain: domainObjectId } : {}),
  })

  if (domainObjectId) {
    // Best-effort: make the new service visible immediately by attaching it to
    // the domain's default group and to every active company under that domain
    // with a price of 0. Failures are non-fatal — the service still exists.
    try {
      await attachServiceToDomainGroup(domainObjectId, created._id)
    } catch (e) {
      console.warn('attachServiceToDomainGroup failed', e)
    }
    try {
      await attachServiceToDomainCompanies(domainObjectId, {
        _id: created._id,
        name: created.name,
        fieldName: created.fieldName,
      })
    } catch (e) {
      console.warn('attachServiceToDomainCompanies failed', e)
    }
  }

  return ok(created.toObject())
}

export async function updateCustomService(
  id: unknown,
  input: UpdateCustomServiceInput,
  ctx: UserContext
): Promise<ServiceResult<any>> {
  if (!ctx.isGlobalAdmin && !ctx.isDomainAdmin) {
    return err('forbidden', 'Недостатньо прав')
  }

  const idStr = id == null ? '' : String(id)
  if (!mongoose.Types.ObjectId.isValid(idStr)) {
    return err('invalid', 'Відсутній або некоректний id')
  }

  const name = parseName(input.name)
  if (!name) {
    return err('invalid', 'Назва послуги не може бути порожньою')
  }

  const parsedType = parseServiceTypeInput(input.serviceType)
  if (!parsedType.ok) {
    return err('invalid', 'Невалідний serviceType')
  }

  const service = await CustomService.findById(idStr)
  if (!service) {
    return err('not_found', 'Сервіс не знайдений')
  }

  const update: Record<string, unknown> = {
    name,
    fieldName: transliterateAndCamelCase(name),
  }
  if (input.serviceType !== undefined) {
    if (parsedType.value) {
      update.serviceType = parsedType.value
    } else {
      update.$unset = { serviceType: '' }
    }
  }

  const serviceDomain = service.domain as mongoose.Types.ObjectId | undefined

  if (ctx.isGlobalAdmin) {
    // Global power: rewrite the original document. For per-domain docs the
    // uniqueness namespace is the service's own domain; for legacy it's the
    // global ($or domain null/missing) pool.
    const uniquenessFilter: Record<string, unknown> = {
      name: { $regex: `^${escapeRegexForMongo(name)}$`, $options: 'i' },
      _id: { $ne: idStr },
    }
    if (serviceDomain) {
      uniquenessFilter.domain = serviceDomain
    } else {
      uniquenessFilter.$or = [{ domain: null }, { domain: { $exists: false } }]
    }
    const duplicate = await CustomService.findOne(uniquenessFilter)
    if (duplicate) {
      return err('conflict', 'Послуга з такою назвою вже існує')
    }
    const updated = await CustomService.findByIdAndUpdate(idStr, update, {
      new: true,
    })
    return ok(updated.toObject())
  }

  // DomainAdmin path — per-domain scoping.
  const access = await assertDomainAccess(input.domainId, ctx)
  if (isServiceErr(access)) return access
  const domainId = access.data

  if (serviceDomain && !domainId.equals(serviceDomain)) {
    return err('forbidden', 'Сервіс не належить вашому домену')
  }

  // Own-domain or legacy → edit the original document. Uniqueness namespace:
  // per-domain (when service has its own domain) or global (when legacy).
  const uniquenessFilter: Record<string, unknown> = {
    name: { $regex: `^${escapeRegexForMongo(name)}$`, $options: 'i' },
    _id: { $ne: idStr },
  }
  if (serviceDomain) {
    uniquenessFilter.domain = serviceDomain
  } else {
    uniquenessFilter.$or = [{ domain: null }, { domain: { $exists: false } }]
  }
  const duplicate = await CustomService.findOne(uniquenessFilter)
  if (duplicate) {
    return err('conflict', 'Послуга з такою назвою вже існує')
  }
  const updated = await CustomService.findByIdAndUpdate(idStr, update, {
    new: true,
  })
  return ok(updated.toObject())
}

export async function deleteCustomService(
  id: unknown,
  input: DeleteCustomServiceInput,
  ctx: UserContext
): Promise<ServiceResult<string>> {
  if (!ctx.isGlobalAdmin && !ctx.isDomainAdmin) {
    return err('forbidden', 'Недостатньо прав')
  }

  const idStr = id == null ? '' : String(id)
  if (!mongoose.Types.ObjectId.isValid(idStr)) {
    return err('invalid', 'Відсутній або некоректний id')
  }

  if (defaultServicesSet.has(idStr)) {
    return err('forbidden', 'Системні послуги не можна видаляти')
  }

  const service = await CustomService.findById(idStr)
  if (!service) {
    return err('not_found', 'Сервіс не знайдений')
  }

  const serviceDomain = service.domain as mongoose.Types.ObjectId | undefined

  if (ctx.isGlobalAdmin) {
    await cascadeDeleteCustomService(idStr, serviceDomain)
    return ok('Сервіс успішно видалено')
  }

  // DomainAdmin path — per-domain scoping.
  const access = await assertDomainAccess(input.domainId, ctx)
  if (isServiceErr(access)) return access
  const domainId = access.data

  if (serviceDomain && !domainId.equals(serviceDomain)) {
    return err('forbidden', 'Сервіс не належить вашому домену')
  }

  // Legacy services (no domain ref) are never referenced in any
  // Domain.customServices group, so cascade is a no-op — skip it.
  await cascadeDeleteCustomService(idStr, serviceDomain)
  return ok('Сервіс успішно видалено')
}

async function cascadeDeleteCustomService(
  serviceId: string,
  domainId?: mongoose.Types.ObjectId
): Promise<void> {
  // Cascade order: pull refs from embedded structures first, then delete the
  // catalog record. If the delete fails, the embeds are already cleaned — they
  // would be orphaned anyway since the catalog record was about to be removed.
  if (domainId) {
    try {
      await detachServiceFromDomainGroups(domainId, serviceId)
    } catch (e) {
      console.warn('detachServiceFromDomainGroups failed', e)
    }
    try {
      await detachServiceFromDomainCompanies(domainId, serviceId)
    } catch (e) {
      console.warn('detachServiceFromDomainCompanies failed', e)
    }
  }
  await CustomService.findByIdAndDelete(serviceId)
}

export interface ListCustomServicesQuery {
  domainId?: unknown
  ids?: unknown
  templateCategory?: unknown
}

const TEMPLATE_CATEGORY_VALUES: ReadonlySet<string> = new Set([
  'utility',
  'it',
  'edu',
  'auto',
  'real-estate',
  'other',
])

function parseTemplateCategory(
  raw: unknown
): DomainTypeTemplateCategory | undefined {
  if (raw === undefined || raw === null || raw === '') return undefined
  const v = String(raw)
  if (!TEMPLATE_CATEGORY_VALUES.has(v)) return undefined
  return v as DomainTypeTemplateCategory
}

function parseIds(raw: unknown): string[] | null {
  if (raw === undefined || raw === null || raw === '') return null
  const rawIds: string[] = Array.isArray(raw)
    ? raw.flatMap((value) => String(value).split(','))
    : String(raw).split(',')
  return rawIds
    .map((id) => id.trim())
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
}

/**
 * Lists CustomServices visible to the caller in a given UI context.
 *
 * - User callers → forbidden.
 * - `domainId` scopes to per-domain services. Combined with `templateCategory`
 *   the response is `(own-domain) ∪ (defaults for this category)`. Without
 *   `templateCategory`, falls back to legacy behavior `(own-domain) ∪ (all
 *   legacy)` for back-compat.
 * - Without `domainId`, returns the global pool (legacy + per-domain), gated
 *   only by role.
 * - `ids` further restricts the result to a list of explicit `_id`s.
 */
export async function listCustomServicesForDomain(
  query: ListCustomServicesQuery,
  ctx: UserContext
): Promise<ServiceResult<unknown[]>> {
  if (!ctx.isGlobalAdmin && !ctx.isDomainAdmin) {
    return err('invalid', 'Не дозволено')
  }

  const filter: Record<string, unknown> = {}

  if (ctx.isDomainAdmin) {
    const domainIds = await Domain.find({
      adminEmails: ctx.user.email,
    }).distinct('_id')

    if (!domainIds.length) {
      return ok([])
    }

    filter.domain = { $in: domainIds }
  }

  if (
    ctx.isGlobalAdmin &&
    query.domainId !== undefined &&
    query.domainId !== null &&
    query.domainId !== ''
  ) {
    const domainIdStr = Array.isArray(query.domainId)
      ? String(query.domainId[0])
      : String(query.domainId)
    if (!mongoose.Types.ObjectId.isValid(domainIdStr)) {
      return err('invalid', 'Невалідний domainId')
    }
    const domainObjectId = new mongoose.Types.ObjectId(domainIdStr)

    const category = parseTemplateCategory(query.templateCategory)
    if (category) {
      const defaultIds = await getDefaultServiceIdsForCategory(category)
      const defaultObjectIds = defaultIds
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id))
      filter.$or = [
        { domain: domainObjectId },
        ...(defaultObjectIds.length
          ? [{ _id: { $in: defaultObjectIds } }]
          : []),
      ]
    } else {
      filter.$or = [
        { domain: domainObjectId },
        { domain: null },
        { domain: { $exists: false } },
      ]
    }
  }

  const validIds = parseIds(query.ids)
  if (validIds !== null) {
    if (validIds.length === 0) return ok([])
    filter._id = { $in: validIds }
  }

  const services = await CustomService.find(filter).lean()
  const seenIds = new Set<string>()
  const seenNames = new Set<string>()
  const unique = services.filter((s: any) => {
    const id = String(s?._id ?? '')
    if (!id || seenIds.has(id)) return false
    const nameKey = String(s?.name ?? '')
      .trim()
      .toLowerCase()
    if (nameKey && seenNames.has(nameKey)) return false
    seenIds.add(id)
    if (nameKey) seenNames.add(nameKey)
    return true
  })
  return ok(unique)
}

export interface LeanCustomService {
  _id: unknown
  [key: string]: unknown
}

export interface DomainServiceGroup {
  groupName: string | null
  services: LeanCustomService[]
}

/**
 * Resolves a domain's `customServices` groups into full service documents.
 *
 * A group's service ids can point either at services scoped to this domain OR at
 * shared/seeded catalog entries (utility services pulled in via a
 * DomainTypeTemplate) that have no `domain` ref. Resolving only against the
 * domain-scoped set drops the shared ones, leaving groups with empty `services`
 * — which silently hides the matching columns in Payment Bulk and breaks invoice
 * grouping. We therefore look services up in a combined map keyed by _id.
 *
 * Domain-scoped services not referenced by any group are appended as a synthetic
 * `groupName: null` "ungrouped" bucket (renderers treat it as standalone rows).
 */
export function assembleDomainServiceCatalog(
  domainCustomServices:
    | Array<{ groupName?: string | null; services?: unknown[] }>
    | undefined,
  domainScopedServices: LeanCustomService[],
  referencedServices: LeanCustomService[]
): DomainServiceGroup[] {
  const servicesById = new Map<string, LeanCustomService>()
  for (const service of domainScopedServices) {
    servicesById.set(String(service._id), service)
  }
  for (const service of referencedServices) {
    servicesById.set(String(service._id), service)
  }

  const groupedServices: DomainServiceGroup[] = (
    domainCustomServices || []
  ).map((group, index) => ({
    groupName: group?.groupName ?? `Група ${index + 1}`,
    services: (group?.services || [])
      .map((id) => servicesById.get(String(id)))
      .filter((service): service is LeanCustomService => Boolean(service)),
  }))

  const groupedIds = new Set(
    groupedServices.flatMap((group) =>
      group.services.map((service) => String(service._id))
    )
  )
  const ungroupedServices = domainScopedServices.filter(
    (service) => !groupedIds.has(String(service._id))
  )

  const result: DomainServiceGroup[] = [...groupedServices]
  if (ungroupedServices.length > 0) {
    // groupName: null marks "not in any user-defined group" — renderers show
    // these as standalone rows instead of under a group header.
    result.push({ groupName: null, services: ungroupedServices })
  }
  return result
}

/** Flattened, de-duplicated service ids referenced across a domain's groups. */
export function collectReferencedServiceIds(
  domainCustomServices:
    | Array<{ groupName?: string | null; services?: unknown[] }>
    | undefined
): string[] {
  return Array.from(
    new Set(
      (domainCustomServices || [])
        .flatMap((group) => group?.services || [])
        .map((id) => String(id))
        .filter((id) => id && id !== 'undefined' && id !== 'null')
    )
  )
}
