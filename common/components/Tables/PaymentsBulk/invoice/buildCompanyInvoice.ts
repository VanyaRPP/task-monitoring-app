import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import { IExtendedRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import serviceFilter from '@components/AddPaymentModal/serviceFilter'
import { defaultServices, Operations } from '@utils/constants'
import { getInvoices } from '@utils/getInvoices'
import { hasTypedColumn, resolveServiceType } from '../columns/column.config'
import type { DomainCustomService } from '../columns/useCustomServicesColumns'
import { findPrevPaymentMatch } from '../hooks/usePrevPayment/usePrevPayment'
import { buildBulkInvoiceMap } from './buildInvoiceMap'
import { buildTypedInvoiceEntry } from './buildTypedInvoiceEntry'
import { resolvePrevReading } from './prevReading'

type Params = {
  company: IExtendedRealestate
  service: IService
  prevService?: IService | null
  prevPayments?: IExtendedPayment[]
  allowedServices: DomainCustomService[]
}

/** Початкове значення рядка Bulk-форми для однієї компанії. */
export const buildCompanyInvoice = ({
  company,
  service,
  prevService,
  prevPayments,
  allowedServices,
}: Params) => {
  const prevPayment = findPrevPaymentMatch(prevPayments, {
    companyId: company._id,
    serviceId: prevService?._id,
    streetId: prevService?.street?._id,
    domainId: prevService?.domain?._id,
  })

  const validPrevPayment =
    prevPayment?.type === Operations.Debit ? prevPayment : undefined

  const allinvoice = getInvoices({
    company,
    service,
    prevService,
    prevPayment: validPrevPayment,
  })

  const filteredInvoice = serviceFilter(allinvoice, allowedServices)

  const invoice = buildBulkInvoiceMap(allinvoice, filteredInvoice)

  for (const s of allowedServices) {
    if (defaultServices.includes(s?._id?.toString())) continue
    // Unique per-service key (see useCustomServicesColumns) — fieldName can collide.
    const key = String(s?._id ?? '')
    if (!key) continue

    const fieldKey = s.fieldName
    // getInvoices seeds a base custom entry keyed by fieldName; adopt it and
    // re-key to the unique _id, dropping the fieldName copy so a service is
    // never submitted twice.
    const existing = invoice[key] ?? (fieldKey ? invoice[fieldKey] : undefined)
    if (fieldKey && fieldKey !== key && invoice[fieldKey]) {
      delete invoice[fieldKey]
    }

    const base = {
      ...(existing || { type: 'custom' }),
      fieldName: fieldKey,
      name: s.name,
      serviceId: key,
    }

    const serviceType = resolveServiceType(s)

    if (hasTypedColumn(serviceType)) {
      // Reading-based type (e.g. electricity): carry over the previous
      // period's meter reading as this period's "Стара" — matched by the
      // stable serviceId (fieldName can collide), exactly like the native
      // electricity column. Загальне is recomputed by the cell.
      const prevReading = resolvePrevReading(validPrevPayment, {
        serviceId: key,
        fieldName: fieldKey,
      })

      invoice[key] = buildTypedInvoiceEntry({
        customService: s,
        serviceType,
        company,
        service,
        prevReading,
        base,
      }) as (typeof invoice)[string]
    } else {
      const amount = (existing as any)?.amount
      invoice[key] = {
        ...base,
        amount: amount === undefined || amount === null ? 1 : amount,
      } as (typeof invoice)[string]
    }
  }

  return { company, invoice }
}
