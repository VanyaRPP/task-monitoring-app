// TODO: fix that cringy typing
// eslint-disable-next-line
// @ts-nocheck

import { useGetAllPaymentsQuery } from '@common/api/paymentApi/payment.api'
import { IPayment } from '@common/api/paymentApi/payment.api.types'
import useCompany from '@common/modules/hooks/useCompany'
import useService from '@common/modules/hooks/useService'
import { IRealEstate } from '@common/modules/models/RealEstate'
import { IService } from '@common/modules/models/Service'
import { Form, FormInstance } from 'antd'

export interface IUsePaymentDataProps {
  form: FormInstance
  paymentData: Partial<IPayment>
}

export function usePaymentData({ form, paymentData }: IUsePaymentDataProps): {
  company?: IRealEstate
  service?: IService
  prevService?: IService
  payment?: IPayment
  prevPayment?: IPayment
} {
  const domainId = Form.useWatch('domain', form)
  const companyId = Form.useWatch('company', form)
  const streetId = Form.useWatch('street', form)
  const serviceId = Form.useWatch('monthService', form)

  const { company: companyData } = useCompany({
    companyId,
    skip: !companyId || !!paymentData,
  })
  const company = paymentData ? paymentData.company : companyData

  const { service: serviceData } = useService({
    serviceId,
    skip: !serviceId || !!paymentData,
  })
  const service = paymentData ? paymentData.monthService : serviceData

  const { data: prevPaymentData } = useGetAllPaymentsQuery(
    {
      companyIds: [companyId],
      domainIds: [domainId],
      streetIds: [streetId],
      year: new Date(service?.date).getFullYear(),
      // use month index instead of number maybe? not 1-12, but 0-11
      month: new Date(service?.date).getMonth(),
      limit: 1,
    },
    { skip: !service || !companyId || !domainId || !streetId }
  )

  const prevPayment = prevPaymentData?.data?.length
    ? prevPaymentData?.data?.[0]
    : null

  return { company, service, payment: paymentData, prevPayment }
}
