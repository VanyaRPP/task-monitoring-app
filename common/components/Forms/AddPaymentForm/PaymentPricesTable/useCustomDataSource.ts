import { IPaymentTableData, dataSource, electricityObj } from './tableData'
import { ServiceType, paymentsTitle } from '@utils/constants'
import { usePaymentContext } from '@common/components/AddPaymentModal'
import useCompany from '@common/modules/hooks/useCompany'
import { useEffect, useState } from 'react'
import { Form } from 'antd'

export function useCustomDataSource({ preview }) {
  const { paymentData, form } = usePaymentContext()
  const companyId = Form.useWatch('company', form) || paymentData?.company

  const [ds, setDataSource] = useState<IPaymentTableData[]>(dataSource)
  const { company } = useCompany({
    companyId,
    skip: preview,
  })
  
  useEffect(() => {
    setDataSource(
      refreshIndexes(
        paymentData?.invoice?.filter(invoice => invoice.type === ServiceType.Inflicion ? paymentData?.company.inflicion || !paymentData : true).map((i) => ({
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
      if (company?.cleaning) {
        itemsToDisplay.push({ name: ServiceType.Cleaning })
      }
      if (company?.discount) {
        itemsToDisplay.push({ name: ServiceType.Discount })
      }
      if (company?.publicElectricUtility) {
        itemsToDisplay.push({ name: ServiceType.ElectricUtility })
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
