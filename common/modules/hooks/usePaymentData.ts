// TODO: fix that cringy typing
// eslint-disable-next-line
// @ts-nocheck

import { useGetAllPaymentsQuery } from '@common/api/paymentApi/payment.api'
import { IPayment } from '@common/api/paymentApi/payment.api.types'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import { IService } from '@common/api/serviceApi/service.api.types'
import useCompany from '@common/modules/hooks/useCompany'
import useService from '@common/modules/hooks/useService'
import { Form, FormInstance } from 'antd'

export interface IUsePaymentDataProps {
  form: FormInstance
  paymentData: Partial<IPayment>
}

export function usePaymentData({ form, paymentData }: IUsePaymentDataProps): {
  company?: IRealestate
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

  const { data: prevServiceData } = useGetAllServicesQuery(
    {
      streetId: service?.street?._id?.toString(),
      domainId: service?.domain?._id?.toString(),
      year: new Date(service?.date).getFullYear(),
      month: new Date(service?.date).getMonth() - 1,
    },
    { skip: !service }
  )
  const prevService = prevServiceData?.data?.length
    ? prevServiceData?.data?.[0]
    : null

  const { data: prevPaymentData } = useGetAllPaymentsQuery(
    {
      companyIds: [companyId],
      domainIds: [domainId],
      streetIds: [streetId],
      year: new Date(prevService?.date).getFullYear(),
      // use month index instead of number maybe? not 1-12, but 0-11
      month: new Date(prevService?.date).getMonth() + 1,
      limit: 1,
    },
    { skip: !prevService || !companyId || !domainId || !streetId }
  )

  const prevPayment = prevPaymentData?.data?.length
    ? prevPaymentData?.data?.[0]
    : null

  return { company, service, prevService, payment: paymentData, prevPayment }
}
