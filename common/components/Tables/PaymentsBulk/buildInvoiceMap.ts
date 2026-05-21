import { IPaymentField } from '@common/api/paymentApi/payment.api.types'

export type BulkInvoiceMap = Record<string, IPaymentField>

const invoiceKey = (inv: Partial<IPaymentField>): string => {
  if (inv.type === 'custom') {
    return inv.fieldName || inv.name || inv.type
  }
  return inv.name || inv.type
}

export function buildBulkInvoiceMap(
  allInvoices: IPaymentField[],
  filteredInvoices: IPaymentField[]
): BulkInvoiceMap {
  const map: BulkInvoiceMap = {}
  for (const inv of allInvoices) {
    map[invoiceKey(inv)] = inv
  }
  for (const inv of filteredInvoices) {
    map[invoiceKey(inv)] = inv
  }
  return map
}