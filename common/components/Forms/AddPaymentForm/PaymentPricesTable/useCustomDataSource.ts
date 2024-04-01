import { IPaymentTableData, electricityObj } from './tableData'
import { ServiceType, paymentsTitle } from '@utils/constants'
import { usePaymentContext } from '@common/components/AddPaymentModal'
import useCompany from '@common/modules/hooks/useCompany'
import { useEffect, useState } from 'react'
import { Form } from 'antd'
import useService from '@common/modules/hooks/useService'
import { getFormattedDate } from '@utils/helpers'
import { useCompanyInvoice } from '@common/modules/hooks/usePayment'
import { getPreviousMonth } from '@common/assets/features/formatDate'
import { IService } from '@common/api/serviceApi/service.api.types'
import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'

export function usePaymentData({ form }): {
  company?: IRealestate
  service?: IService
  prevService?: IService
} {
  const companyId = Form.useWatch('company', form)
  const serviceId = Form.useWatch('monthService', form)

  const { company } = useCompany({ companyId })
  const { service } = useService({ serviceId })
  const { service: prevService } = usePrevService({ serviceId })

  return { company, service, prevService }
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

// export function useCustomDataSource({ preview }) {
//   const { paymentData, form } = usePaymentContext()

//   const [dataSource, setDataSource] = useState<IPaymentTableData[]>([])

//   const { company, service, prevService } = usePaymentData({ form })

//   useEffect(() => {
//     setDataSource(paymentData?.invoice)
//   }, [setDataSource, paymentData?.invoice])

//   useEffect(() => {
//     if (!paymentData?.invoice) {
//       return
//     }

//     const itemsToDisplay = []

//     if (company?.inflicion) {
//       itemsToDisplay.push({ name: ServiceType.Inflicion })
//     }
//     itemsToDisplay.push(electricityObj)
//     itemsToDisplay.push({
//       name: company?.waterPart ? ServiceType.WaterPart : ServiceType.Water,
//     })
//     if (company?.garbageCollector) {
//       itemsToDisplay.push({ name: ServiceType.GarbageCollector })
//     }
//     if (company?.cleaning) {
//       itemsToDisplay.push({ name: ServiceType.Cleaning })
//     }
//     if (company?.discount) {
//       itemsToDisplay.push({ name: ServiceType.Discount })
//     }

//     if (itemsToDisplay.length > 0) {
//       setDataSource([...dataSource, ...itemsToDisplay])
//     }

//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [setDataSource, company, service, prevService])

//   const removeDataSource = (name) => {
//     setDataSource(dataSource.filter((item) => item.name !== name))
//   }

//   const addDataSource = (newObj) => {
//     setDataSource([...dataSource, newObj])
//   }

//   return {
//     customDataSource: dataSource,
//     removeDataSource,
//     addDataSource,
//   }
// }

// const useDateMonth = (preview) => {
//   const { paymentData, form } = usePaymentContext()
//   const serviceId = Form.useWatch('monthService', form) || paymentData?.service
//   const { service } = useService({ serviceId, skip: preview })
//   return getFormattedDate(
//     paymentData?.monthService?.date ||
//       paymentData?.invoiceCreationDate ||
//       service?.date
//   )
// }

// // TODO: add ts
// const usePrevPlacingPrice = ({
//   companyId,
//   company,
//   service,
// }: {
//   companyId: string
//   company: any
//   service: any
// }) => {
//   // TODO: fix. Still prev invoice is wrong
//   // issue in invoice creation date, but we needs acutally prev invoice
//   const { month, year } = getPreviousMonth(service?.date)
//   const { lastInvoice } = useCompanyInvoice({ companyId, month, year })

//   const previousPlacingPrice = lastInvoice?.invoice?.find(
//     (item) => item.type === ServiceType.Placing
//   )?.sum
//   const defaultPlacingPrice =
//     company?.totalArea &&
//     company?.pricePerMeter &&
//     company?.totalArea * company?.pricePerMeter

//   return previousPlacingPrice || defaultPlacingPrice
// }
