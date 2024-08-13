import { useGetAllPaymentsQuery } from '@common/api/paymentApi/payment.api'
import { IPayment } from '@common/api/paymentApi/payment.api.types'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import { IService } from '@common/api/serviceApi/service.api.types'
import { Operations } from '@utils/constants'
import { Form, FormInstance } from 'antd'
import dayjs from 'dayjs'

export interface IUsePaymentDataProps {
  form: FormInstance
  paymentData: Partial<IPayment>
}

// export const usePaymentFormData = (
//   form: FormInstance,
//   paymentData: IPayment = null
// ): {
//   service?: IService
//   company?: IRealestate
//   payment?: IPayment
//   prevPayment?: IPayment
//   prevService?: IService
// } => {
//   const domainId: string | undefined =
//     Form.useWatch('domain', form) ??
//     (typeof paymentData?.domain === 'string'
//       ? paymentData.domain
//       : (paymentData?.domain as IDomain)?._id)

//   const serviceId: string | undefined =
//     Form.useWatch('monthService', form) ??
//     (typeof paymentData?.monthService === 'string'
//       ? paymentData.monthService
//       : (paymentData?.monthService as IService)?._id)

//   const streetId: string | undefined =
//     Form.useWatch('street', form) ??
//     (typeof paymentData?.street === 'string'
//       ? paymentData.street
//       : (paymentData?.street as IStreet)?._id)

//   const companyId: string | undefined =
//     Form.useWatch('company', form) ??
//     (typeof paymentData?.company === 'string'
//       ? paymentData.company
//       : (paymentData?.company as IExtendedRealestate)?._id)

//   // const domain = TODO:???
//   // const street = TODO:???

//   const { data: { data: { 0: service } } = { data: { 0: null } } } =
//     useGetAllServicesQuery({ serviceId, limit: 1 }, { skip: !serviceId })

//   const { data: { data: { 0: prevService } } = { data: { 0: null } } } =
//     useGetAllServicesQuery(
//       {
//         streetId: service?.street._id || streetId,
//         domainId: service?.domain._id || domainId,
//         month: dayjs(service?.date).month() - 1,
//         year: dayjs(service?.date).year(),
//         limit: 1,
//       },
//       { skip: !service && (!streetId || !domainId) }
//     )

//   const { data: { data: { 0: company } } = { data: { 0: null } } } =
//     useGetAllRealEstateQuery(
//       { companyId, limit: 1 },
//       {
//         skip: !companyId,
//       }
//     )

//   const { data: { data: { 0: payment } } = { data: { 0: paymentData } } } =
//     useGetAllPaymentsQuery(
//       {
//         domainIds: [domainId],
//         serviceIds: [serviceId],
//         streetIds: [streetId],
//         companyIds: [companyId],
//         limit: 1,
//       },
//       { skip: !domainId || !serviceId || !streetId || !companyId }
//     )

//   const { data: { data: { 0: prevPayment } } = { data: { 0: null } } } =
//     useGetAllPaymentsQuery(
//       {
//         companyIds: [companyId],
//         domainIds: [domainId],
//         streetIds: [streetId],
//         serviceIds: [prevService?._id],
//         limit: 1,
//       },
//       { skip: !prevService }
//     )

//   return {
//     service: serviceId ? service : null,
//     company: companyId ? company : null,
//     payment:
//       domainId && serviceId && streetId && companyId ? payment : paymentData,
//     prevPayment:
//       domainId && service && companyId && prevService ? prevPayment : null,
//     prevService: domainId && streetId ? prevService : null,
//   }
// }

export function usePaymentFormData(
  form: FormInstance,
  paymentData: IPayment = null
): {
  company?: IRealestate | null
  service?: IService | null
  prevService?: IService | null
  payment?: IPayment | null
  prevPayment?: IPayment | null
} {
  const domainId = Form.useWatch('domain', form)
  const companyId = Form.useWatch('company', form)
  const streetId = Form.useWatch('street', form)
  const serviceId = Form.useWatch('monthService', form)

  const { data: { data: { 0: company } } = { data: [null] } } =
    useGetAllRealEstateQuery(
      { companyId, limit: 1 },
      { skip: !companyId || !!paymentData }
    )

  const { data: { data: { 0: service } } = { data: [null] } } =
    useGetAllServicesQuery(
      { serviceId, limit: 1 },
      { skip: !serviceId || !domainId || !streetId || !!paymentData }
    )

  const { data: { data: { 0: prevService } } = { data: [null] } } =
    useGetAllServicesQuery(
      {
        streetId,
        domainId,
        // eslint-disable-next-line
        // @ts-ignore
        month: dayjs(service?.date).month(),
        // eslint-disable-next-line
        // @ts-ignore
        year: dayjs(service?.date).year(),
        limit: 1,
      },
      { skip: !serviceId || !domainId || !streetId || !service }
    )

  const { data: { data: { 0: prevPayment } } = { data: [null] } } =
    useGetAllPaymentsQuery(
      {
        companyIds: [companyId],
        streetIds: [streetId],
        domainIds: [domainId],
        serviceIds: [prevService?._id],
        type: Operations.Debit,
        limit: 1,
      },
      {
        skip:
          !serviceId || !domainId || !streetId || !prevService || !companyId,
      }
    )

  return {
    // eslint-disable-next-line
    // @ts-ignore
    company: companyId ? company : paymentData?.company,
    // eslint-disable-next-line
    // @ts-ignore
    service:
      serviceId && domainId && streetId ? service : paymentData?.monthService,
    payment: paymentData,
    prevService:
      serviceId && domainId && streetId && service ? prevService : null,
    prevPayment:
      serviceId && domainId && streetId && !!prevService && companyId
        ? prevPayment
        : null,
  }
}
