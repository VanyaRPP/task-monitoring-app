import { useGetAllPaymentsQuery } from '@common/api/paymentApi/payment.api'
import { IPayment } from '@common/api/paymentApi/payment.api.types'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import {
  IExtendedRealestate,
  IRealestate,
} from '@common/api/realestateApi/realestate.api.types'
import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import { IService } from '@common/api/serviceApi/service.api.types'
import useCompany from '@modules/hooks/useCompany'
import useService from '@modules/hooks/useService'
import { IDomain } from '@modules/models/Domain'
import { IStreet } from '@modules/models/Street'
import { Form, FormInstance } from 'antd'
import dayjs from 'dayjs'

export interface IUsePaymentDataProps {
  form: FormInstance
  paymentData: Partial<IPayment>
}

export const usePaymentFormData = (
  form: FormInstance,
  paymentData: IPayment = null
): {
  service?: IService
  company?: IRealestate
  payment?: IPayment
  prevPayment?: IPayment
  prevService?: IService
} => {
  const domainId: string | undefined =
    Form.useWatch('domain', form) ??
    (typeof paymentData?.domain === 'string'
      ? paymentData.domain
      : (paymentData?.domain as IDomain)?._id)

  const serviceId: string | undefined =
    Form.useWatch('monthService', form) ??
    (typeof paymentData?.monthService === 'string'
      ? paymentData.monthService
      : (paymentData?.monthService as IService)?._id)

  const streetId: string | undefined =
    Form.useWatch('street', form) ??
    (typeof paymentData?.street === 'string'
      ? paymentData.street
      : (paymentData?.street as IStreet)?._id)

  const companyId: string | undefined =
    Form.useWatch('company', form) ??
    (typeof paymentData?.company === 'string'
      ? paymentData.company
      : (paymentData?.company as IExtendedRealestate)?._id)

  // const domain = TODO:???
  // const street = TODO:???

  const { data: { data: { 0: service } } = { data: { 0: null } } } =
    useGetAllServicesQuery({ serviceId, limit: 1 }, { skip: !serviceId })

  const { data: { data: { 0: prevService } } = { data: { 0: null } } } =
    useGetAllServicesQuery(
      {
        streetId: service?.street._id || streetId,
        domainId: service?.domain._id || domainId,
        month: dayjs(service?.date).month() - 1,
        year: dayjs(service?.date).year(),
        limit: 1,
      },
      { skip: !service && (!streetId || !domainId) }
    )

  const { data: { data: { 0: company } } = { data: { 0: null } } } =
    useGetAllRealEstateQuery(
      { companyId, limit: 1 },
      {
        skip: !companyId,
      }
    )

  const { data: { data: { 0: payment } } = { data: { 0: paymentData } } } =
    useGetAllPaymentsQuery(
      {
        domainIds: [domainId],
        serviceIds: [serviceId],
        streetIds: [streetId],
        companyIds: [companyId],
        limit: 1,
      },
      { skip: !domainId || !serviceId || !streetId || !companyId }
    )

  const { data: { data: { 0: prevPayment } } = { data: { 0: null } } } =
    useGetAllPaymentsQuery(
      {
        companyIds: [companyId],
        domainIds: [domainId],
        streetIds: [streetId],
        serviceIds: [prevService?._id],
        limit: 1,
      },
      { skip: !prevService }
    )

  return {
    service: serviceId ? service : null,
    company: companyId ? company : null,
    payment:
      domainId && serviceId && streetId && companyId ? payment : paymentData,
    prevPayment:
      domainId && service && companyId && prevService ? prevPayment : null,
    prevService: domainId && streetId ? prevService : null,
  }
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
      domainId,
      streetId,
      // eslint-disable-next-line
      // @ts-ignore
      year: new Date(service?.date).getFullYear(),
      // eslint-disable-next-line
      // @ts-ignore
      month: new Date(service?.date).getMonth(),
    },
    { skip: !service || !domainId || !streetId }
  )
  const prevService = prevServiceData?.data?.length
    ? prevServiceData.data[0]
    : null

  const { data: prevPaymentData } = useGetAllPaymentsQuery(
    {
      companyIds: [companyId],
      domainIds: [domainId],
      streetIds: [streetId],
      serviceIds: [prevService?._id],
      limit: 1,
    },
    { skip: !service || !companyId || !domainId || !streetId }
  )

  const prevPayment = prevPaymentData?.data?.length
    ? prevPaymentData?.data?.[0]
    : null

  // eslint-disable-next-line
  // @ts-ignore
  return { company, service, payment: paymentData, prevService, prevPayment }
}
