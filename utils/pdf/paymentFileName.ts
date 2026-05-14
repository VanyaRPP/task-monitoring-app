import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import dayjs from 'dayjs'

export type InvoiceFileKind = 'inv' | 'act' | 'dov'

const sanitizeCompany = (raw: string): string =>
  raw.replace(/[\\/:*?"<>|]/g, '').trim()

export function buildInvoiceFileName(
  payment:
    | Pick<
        IExtendedPayment,
        'invoiceNumber' | 'invoiceCreationDate' | 'reciever'
      >
    | null
    | undefined,
  kind: InvoiceFileKind = 'inv'
): string {
  const companyName =
    sanitizeCompany(payment?.reciever?.companyName ?? '') || 'invoice'
  const rawDate = payment?.invoiceCreationDate
  const datePrefix =
    rawDate != null && dayjs(rawDate).isValid()
      ? dayjs(rawDate).format('DDMMYY')
      : ''
  const slug = `${datePrefix}${payment?.invoiceNumber ?? ''}`
  return `${companyName}-${kind}-${slug}`
}
