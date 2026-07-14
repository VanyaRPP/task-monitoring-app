import {
  IPayment,
  IPaymentField,
} from '@common/api/paymentApi/payment.api.types'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import { ServiceType } from '../constants'
import { resolveServiceType } from './resolve-service-type'

export type IInvoiceLineAddPayload = Partial<IPaymentField> & {
  type: ServiceType | string
}

export interface IDomainCatalogServiceRow {
  _id: string
  name: string
  fieldName: string
  groupName: string
  serviceType?: string | null
}

export interface IDomainCatalogGroup {
  groupName: string
  services: {
    _id: string | unknown
    name: string
    fieldName: string
    serviceType?: string | null
  }[]
}

export interface IInvoicePriceContext {
  company?: Partial<IRealestate> | null
  service?: Partial<IService> | null
  prevPayment?: Partial<IPayment> | null
}

export function flattenDomainCatalogServices(
  groups: IDomainCatalogGroup[]
): IDomainCatalogServiceRow[] {
  const seen = new Set<string>()
  const out: IDomainCatalogServiceRow[] = []
  for (const g of groups) {
    const gName = g.groupName ?? ''
    for (const s of g.services || []) {
      const id = String(s._id)
      if (!id || seen.has(id)) continue
      seen.add(id)
      out.push({
        _id: id,
        name: s.name,
        fieldName: s.fieldName,
        groupName: gName,
        serviceType: s.serviceType ?? null,
      })
    }
  }
  return out
}

export function invoiceLineExcludeKey(
  inv: Pick<IPaymentField, 'type' | 'fieldName' | 'serviceId'>
): string {
  if (inv.serviceId) return `sid:${inv.serviceId}`
  const t = inv.type
  if (t === ServiceType.Custom || t === 'custom') {
    if (inv.fieldName) return `custom:${inv.fieldName}`
    return 'custom:generic'
  }
  return `stype:${t}`
}

export function typedServiceTypesOnInvoice(
  invoices:
    | ReadonlyArray<Pick<IPaymentField, 'type' | 'serviceId'> | null | undefined>
    | undefined
): Set<string> {
  const types = new Set<string>()
  for (const inv of invoices ?? []) {
    if (!inv || inv.serviceId) continue
    const type = inv.type
    if (!type || type === ServiceType.Custom || type === 'custom') continue
    types.add(String(type))
  }
  return types
}

export function isCatalogOptionExcluded(
  option: { value: string; payload: IInvoiceLineAddPayload },
  excludeKeys: ReadonlyArray<string> | undefined,
  excludeServiceTypes?: ReadonlySet<string>
): boolean {
  if (excludeKeys?.includes(option.value)) return true
  const type = option.payload?.type
  if (
    excludeServiceTypes &&
    type &&
    type !== ServiceType.Custom &&
    type !== 'custom' &&
    excludeServiceTypes.has(String(type))
  ) {
    return true
  }
  return false
}

export function resolveCustomServicePrice(
  fieldName: string | undefined,
  ctx: IInvoicePriceContext
): number | undefined {
  if (!fieldName) return undefined
  const fromCompany = ctx.company?.customServices?.find(
    (s) => s.fieldName === fieldName
  )?.price
  if (fromCompany != null) return fromCompany
  const fromService = ctx.service?.customServices?.find(
    (s) => s.fieldName === fieldName
  )?.price
  if (fromService != null) return fromService
  return ctx.prevPayment?.invoice?.find(
    (inv) => inv.type === ServiceType.Custom && inv.fieldName === fieldName
  )?.price
}

export function buildInvoiceAddPayloadFromCatalogRow(
  row: Pick<
    IDomainCatalogServiceRow,
    '_id' | 'name' | 'fieldName' | 'serviceType'
  >,
  context: IInvoicePriceContext = {}
): IInvoiceLineAddPayload {
  const id = String(row._id)
  const resolved = resolveServiceType({
    _id: id,
    serviceType: row.serviceType ?? null,
    fieldName: row.fieldName,
  })
  if (resolved) {
    return { type: resolved, serviceId: id }
  }
  const price = resolveCustomServicePrice(row.fieldName, context) ?? 0
  return {
    type: ServiceType.Custom,
    name: row.name,
    fieldName: row.fieldName,
    serviceId: id,
    customService: true,
    amount: 1,
    price,
    sum: price,
  }
}

export function catalogRowToSelectOption(
  row: IDomainCatalogServiceRow,
  context: IInvoicePriceContext = {}
): {
  value: string
  label: string
  payload: IInvoiceLineAddPayload
} {
  const payload = buildInvoiceAddPayloadFromCatalogRow(row, context)
  const excludeKey = invoiceLineExcludeKey({
    type: payload.type,
    fieldName: payload.fieldName,
    serviceId: payload.serviceId,
  })
  const label = row.name
  return { value: excludeKey, label, payload }
}
