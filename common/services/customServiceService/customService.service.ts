import CustomService from '@modules/models/CustomService'
import Domain from '@modules/models/Domain'
import { ServiceType } from '@utils/constants'
import { escapeRegexForMongo } from '@utils/escape-regex/escape-regex'
import { defaultServicesSet } from '@utils/helpers'
import { transliterateAndCamelCase } from '@utils/transliterateAndCamelCase'
import mongoose from 'mongoose'

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
    uniquenessFilter.$or = [
      { domain: null },
      { domain: { $exists: false } },
    ]
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
      uniquenessFilter.$or = [
        { domain: null },
        { domain: { $exists: false } },
      ]
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
    uniquenessFilter.$or = [
      { domain: null },
      { domain: { $exists: false } },
    ]
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

  if (ctx.isGlobalAdmin) {
    await CustomService.findByIdAndDelete(idStr)
    return ok('Сервіс успішно видалено')
  }

  // DomainAdmin path — per-domain scoping.
  const access = await assertDomainAccess(input.domainId, ctx)
  if (isServiceErr(access)) return access
  const domainId = access.data

  const serviceDomain = service.domain as mongoose.Types.ObjectId | undefined

  if (serviceDomain && !domainId.equals(serviceDomain)) {
    return err('forbidden', 'Сервіс не належить вашому домену')
  }

  // Own-domain or legacy → delete the original document.
  await CustomService.findByIdAndDelete(idStr)
  return ok('Сервіс успішно видалено')
}
