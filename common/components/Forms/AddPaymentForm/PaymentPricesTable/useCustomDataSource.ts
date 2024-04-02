import { IPayment } from '@common/api/paymentApi/payment.api.types'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import { IService } from '@common/api/serviceApi/service.api.types'
import useCompany from '@common/modules/hooks/useCompany'
// import { usePayment } from '@common/modules/hooks/usePayment'
import useService from '@common/modules/hooks/useService'
import { Form } from 'antd'

export function usePaymentData({ form }): {
  company?: IRealestate
  service?: IService
  prevService?: IService
  prevPayment?: IPayment
} {
  // const paymentId = Form.useWatch('payment', form)
  const companyId = Form.useWatch('company', form)
  const serviceId = Form.useWatch('monthService', form)

  const { company } = useCompany({ companyId })
  const { service } = useService({ serviceId })
  const { service: prevService } = usePrevService({ serviceId })
  // const { payment: prevPayment } = usePrevPayment({ paymentId })

  return { company, service, prevService, prevPayment: null }
}

export function usePrevService({
  serviceId,
  skip,
}: {
  serviceId: string
  skip?: boolean
}): { service?: IService } {
  const { service } = useService({ serviceId, skip })

  const { data } = useGetAllServicesQuery({
    streetId: service?.street?._id.toString(),
    domainId: service?.domain?._id.toString(),
    year: new Date(service?.date).getFullYear(),
    month: new Date(service?.date).getMonth() - 1,
  })

  const prevService = data?.data?.length ? data?.data?.[0] : null

  return { service: prevService }
}

// export function usePrevPayment({
//   paymentId,
//   skip,
// }: {
//   paymentId: string
//   skip?: boolean
// }): { payment?: IPayment } {
//   const { payment } = usePayment({ paymentId, skip })

//   const { data } = useGetAllPaymentsQuery({
//     companyIds: [(payment?.company as IExtendedRealestate)?._id.toString()],
//     domainIds: [(payment?.domain as IDomain)?._id.toString()],
//     year: new Date(payment?.invoiceCreationDate).getFullYear(),
//     month: new Date(payment?.invoiceCreationDate).getMonth() - 1,
//     limit: 1,
//   })

//   const prevPayment = data?.data?.length ? data?.data?.[0] : null

//   return { payment: prevPayment }
// }
