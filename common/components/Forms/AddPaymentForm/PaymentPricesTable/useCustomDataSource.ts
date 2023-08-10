import { useEffect, useState } from 'react'
import { IPaymentTableData, dataSource } from '@utils/tableData'
import useCompany from '@common/modules/hooks/useCompany'
// import useService from '@common/modules/hooks/useService'
import { ServiceType } from '@utils/constants'

export function useCustomDataSource({
  paymentData,
  companyId,
  // serviceId,
  domainId,
  streetId,
  edit,
}) {
  const [ds, setDataSource] = useState<IPaymentTableData[]>(dataSource)
  const { company } = useCompany({
    companyId,
    domainId,
    streetId,
    skip: edit,
  })

  // const { service } = useService({
  //   serviceId,
  //   domainId,
  //   streetId,
  //   skip: edit,
  // })

  useEffect(() => {
    setDataSource(
      refreshIndexes(paymentData?.invoice?.map((i) => ({ ...i, name: i.type })))
    )
  }, [paymentData?.invoice])

  useEffect(() => {
    if (company?.garbageCollector) {
      const garbage = {
        name: ServiceType.GarbageCollector,
        amount: 0,
        price: 0,
        sum: 0,
      }
      setDataSource(refreshIndexes([...dataSource, garbage]))
    }
    // TODO: After adding in company Boolean inflicion
    // if (company.inflicion) {
    //   const inflicion = {
    //     name: ServiceType.Inflicion,
    //     amount: 0,
    //     price: 0,
    //     TODO: value from service * company base rent
    //     sum: 0,
    //   }
    //   setDataSource(prev => refreshIndexes([...prev, inflicion]))
    // }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?._id])

  const removeDataSource = (id) => {
    setDataSource((prev) =>
      refreshIndexes(prev.filter((item) => item.id !== id))
    )
  }

  const addDataSource = (newObj) => {
    setDataSource(refreshIndexes([...ds, newObj]))
  }

  return {
    customDataSource: ds as IPaymentTableData[],
    removeDataSource,
    addDataSource,
  }
}

function refreshIndexes(arr = []) {
  return arr.map((i, index) => ({ ...i, id: index + 1 }))
}
