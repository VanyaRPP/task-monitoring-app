import { useGetAllPaymentsQuery } from '@common/api/paymentApi/payment.api'
import { IPayment } from '@common/api/paymentApi/payment.api.types'
import {
  IExtendedRealestate,
  IRealestate,
} from '@common/api/realestateApi/realestate.api.types'
import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import { IService } from '@common/api/serviceApi/service.api.types'
import useCompany from '@common/modules/hooks/useCompany'
import useService from '@common/modules/hooks/useService'
import { IDomain } from '@common/modules/models/Domain'
import { IStreet } from '@common/modules/models/Street'
import { Form } from 'antd'

export function usePaymentData({ form }): {
  company?: IRealestate
  service?: IService
  prevService?: IService
  payment?: IPayment
  prevPayment?: IPayment
} {
  const streetId = Form.useWatch('street', form)
  const domainId = Form.useWatch('domain', form)
  const companyId = Form.useWatch('company', form)
  const serviceId = Form.useWatch('monthService', form)

  // console.debug('usePaymentData INPUTS', {
  //   streetId,
  //   domainId,
  //   companyId,
  //   serviceId,
  // })

  const { company } = useCompany({ companyId })
  const { service, prevService } = usePrevService({ serviceId })
  const { payment, prevPayment } = usePrevPayment({
    streetId,
    domainId,
    companyId,
  })

  // console.debug('usePaymentData OUTPUTS', {
  //   company,
  //   service,
  //   prevService,
  //   payment,
  //   prevPayment,
  // })

  return { company, service, prevService, payment, prevPayment }
}

export function usePrevService({
  serviceId,
  skip,
}: {
  serviceId: string
  skip?: boolean
}): { service?: IService; prevService?: IService } {
  const { service } = useService({ serviceId, skip })

  const { data } = useGetAllServicesQuery({
    streetId: service?.street?._id.toString(),
    domainId: service?.domain?._id.toString(),
    year: new Date(service?.date).getFullYear(),
    month: new Date(service?.date).getMonth() - 1,
  })

  const prevService = data?.data?.length ? data?.data?.[0] : null

  return { service, prevService }
}

export function usePrevPayment({
  companyId,
  domainId,
  streetId,
  skip,
}: {
  companyId: string
  domainId: string
  streetId: string
  skip?: boolean
}): { payment?: IPayment; prevPayment?: IPayment } {
  // TODO: usePayment
  const { data: currData } = useGetAllPaymentsQuery(
    {
      // TODO: fix getting payment for wrong company based only on domain and street
      companyIds: [companyId],
      streetIds: [streetId],
      domainIds: [domainId],
      // TODO: fix year/month query handling on API
      // year: new Date().getFullYear(),
      // month: new Date().getMonth() - 1,
      limit: 1,
    },
    { skip }
  )

  const payment = currData?.data?.length ? currData?.data?.[0] : null

  const { data: prevData } = useGetAllPaymentsQuery(
    {
      // TODO: fix getting payment for wrong company based only on domain and street
      companyIds: [(payment?.company as IExtendedRealestate)?._id.toString()],
      domainIds: [(payment?.domain as IDomain)?._id.toString()],
      streetIds: [(payment?.street as IStreet)?._id.toString()],
      // TODO: fix year/month query handling on API
      // year: new Date(payment?.invoiceCreationDate).getFullYear(),
      // month: new Date(payment?.invoiceCreationDate).getMonth() - 1,
      limit: 1,
    },
    { skip }
  )

  const prevPayment = prevData?.data?.length ? prevData?.data?.[0] : null

  return { payment, prevPayment }
}
