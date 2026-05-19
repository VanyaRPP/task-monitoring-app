import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { ServiceType } from '@utils/constants'

export type BulkInvoiceMap = Record<string, IPaymentField>

const invoiceKey = (inv: Partial<IPaymentField>): string => {
  if (inv.type === 'custom') {
    return inv.fieldName || inv.name || inv.type
  }
  return inv.name || inv.type
}

const list = new Set([
  ServiceType.Maintenance,
  ServiceType.Placing,
  ServiceType.Electricity,
  ServiceType.Water,
])

const normalizeInvoice = (inv: IPaymentField): IPaymentField =>
  list.has(inv.type as ServiceType)
    ? { ...inv, amount: 1 }
    : inv

export function buildBulkInvoiceMap(
  allInvoices: IPaymentField[],
  filteredInvoices: IPaymentField[]
): BulkInvoiceMap {
  const map: BulkInvoiceMap = {}
  for (const inv of allInvoices) {
    map[invoiceKey(inv)] = normalizeInvoice(inv)
  }
  for (const inv of filteredInvoices) {
    map[invoiceKey(inv)] = normalizeInvoice(inv)
  }
  return map
}