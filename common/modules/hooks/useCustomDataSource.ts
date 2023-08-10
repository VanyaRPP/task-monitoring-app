import { useState } from 'react'
import { dataSource } from "@utils/tableData"
import useCompany from './useCompany'
import useService from './useService'

export function useCustomDataSource(paymentData, companyId, serviceId, domainId, streetId, edit) {
  const { company } = useCompany({
    companyId,
    domainId,
    streetId,
    skip: edit,
  })
  const { service } = useService({
    serviceId,
    domainId,
    streetId,
    skip: edit,
  })


  const [customDataSource, setCustomDataSource] = useState(
    paymentData
      ? paymentData?.invoice?.map((item) => {
          return {
            id: paymentData.invoice.indexOf(item) + 1,
            name: item.type,
            ...item,
          }
        })
      : dataSource
  )
}