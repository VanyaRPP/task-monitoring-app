import { IPaymentTableData, dataSource, electricityObj } from './tableData'
import { ServiceType, paymentsTitle } from '@utils/constants'
import useCompany from '@common/modules/hooks/useCompany'
import { useEffect, useState } from 'react'

export function useCustomDataSource({ paymentData, companyId, edit }) {
  const [ds, setDataSource] = useState<IPaymentTableData[]>(dataSource)
  const { company } = useCompany({
    companyId,
    skip: edit,
  })

  useEffect(() => {
    setDataSource(
      refreshIndexes(
        paymentData?.invoice?.map((i) => ({
          ...i,
          name: paymentsTitle.hasOwnProperty(i.type) ? i.type : i.name,
        }))
      )
    )
  }, [paymentData?.invoice])

  useEffect(() => {
    if (!paymentData?.invoice) {
      const itemsToDisplay = []
      if (company?.inflicion) {
        itemsToDisplay.push({ name: ServiceType.Inflicion })
      }
      itemsToDisplay.push(electricityObj)
      itemsToDisplay.push({
        name: company?.waterPart ? ServiceType.WaterPart : ServiceType.Water,
      })
      if (company?.garbageCollector) {
        itemsToDisplay.push({ name: ServiceType.GarbageCollector })
      }
      if (company?.discount) {
        itemsToDisplay.push({ name: ServiceType.Discount })
      }
      if (itemsToDisplay.length > 0) {
        setDataSource(refreshIndexes([...dataSource, ...itemsToDisplay]))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company])

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
