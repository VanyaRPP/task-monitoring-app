import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { UTILITY_SERVICE_ID_TO_TYPE, ServiceType } from '../constants'

export type IInvoiceLineAddPayload = Partial<IPaymentField> & {
  type: ServiceType | string
}

export interface IDomainCatalogServiceRow {
  _id: string
  name: string
  fieldName: string
  groupName: string
}

export interface IDomainCatalogGroup {
  groupName: string
  services: {
    _id: string | unknown
    name: string
    fieldName: string
  }[]
}

const SERVICE_TYPE_VALUES = new Set<string>(Object.values(ServiceType))

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

function isEnumUtilityServiceType(
  fieldName: string
): fieldName is ServiceType {
  return (
    SERVICE_TYPE_VALUES.has(fieldName) &&
    fieldName !== ServiceType.Custom &&
    fieldName !== 'custom'
  )
}

export function buildInvoiceAddPayloadFromCatalogRow(
  row: Pick<IDomainCatalogServiceRow, '_id' | 'name' | 'fieldName'>
): IInvoiceLineAddPayload {
  const id = String(row._id)
  const mapped = UTILITY_SERVICE_ID_TO_TYPE[id]
  if (mapped) {
    return { type: mapped, serviceId: id }
  }
  if (row.fieldName && isEnumUtilityServiceType(row.fieldName)) {
    return { type: row.fieldName, serviceId: id }
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
  const label =
    row.groupName && row.groupName.trim()
      ? `${row.name} (${row.groupName})`
      : row.name
  return { value: excludeKey, label, payload }
}
