import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'
import { useEffect, useMemo } from 'react'
import type { DomainCustomService } from '../columns/useCustomServicesColumns'
import { buildCompanyInvoice } from './buildCompanyInvoice'

/** Заповнює `payments` форми рядками компаній, коли змінюються дані місяця. */
export const usePaymentsFormValue = (
  allowedServices: DomainCustomService[]
) => {
  const { form, service, companies, prevPayments, prevService } =
    useInvoicesPaymentContext()

  const paymentsValue = useMemo(() => {
    if (!companies || companies.length === 0 || !service) return []

    return companies.map((company) =>
      buildCompanyInvoice({
        company,
        service,
        prevService,
        prevPayments,
        allowedServices,
      })
    )
  }, [companies, service, prevService, prevPayments, allowedServices])

  useEffect(() => {
    form.setFieldsValue({ payments: paymentsValue })
  }, [form, paymentsValue])
}
