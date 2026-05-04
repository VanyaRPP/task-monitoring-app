import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
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

export function buildInvoiceAddPayloadFromCatalogRow(
  row: Pick<
    IDomainCatalogServiceRow,
    '_id' | 'name' | 'fieldName' | 'serviceType'
  >
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
  return {
    type: ServiceType.Custom,
    name: row.name,
    fieldName: row.fieldName,
    serviceId: id,
    customService: true,
    amount: 1,
    price: 0,
    sum: 0,
  }
}

export function catalogRowToSelectOption(row: IDomainCatalogServiceRow): {
  value: string
  label: string
  payload: IInvoiceLineAddPayload
} {
  const payload = buildInvoiceAddPayloadFromCatalogRow(row)
  const excludeKey = invoiceLineExcludeKey({
    type: payload.type,
    fieldName: payload.fieldName,
    serviceId: payload.serviceId,
  })
  const label = row.name
  return { value: excludeKey, label, payload }
}
