import { useMemo } from 'react'
import { Form } from 'antd'
import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'
import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'

const getFieldId = (field: any): string | undefined => {
  if (!field) return undefined
  return typeof field === 'string' ? field : field._id
}

export const findPrevPaymentMatch = (
  payments: IExtendedPayment[] | undefined,
  criteria: {
    companyId?: string
    serviceId?: string
    streetId?: string
    domainId?: string
  }
) => {
  return payments?.find((prev) => {
    return (
      getFieldId(prev?.company) === criteria.companyId &&
      getFieldId(prev?.monthService) === criteria.serviceId &&
      getFieldId(prev?.street) === criteria.streetId &&
      getFieldId(prev?.domain) === criteria.domainId
    )
  })
}

export const usePrevPayment = (name: number): IExtendedPayment | undefined => {
  const { form, prevService, prevPayments } = useInvoicesPaymentContext()
  const companyId = Form.useWatch(['payments', name, 'company', '_id'], form)

  return useMemo(() => {
    return findPrevPaymentMatch(prevPayments, {
      companyId,
      serviceId: getFieldId(prevService),
      streetId: getFieldId(prevService?.street),
      domainId: getFieldId(prevService?.domain),
    })
  }, [prevPayments, companyId, prevService])
}
