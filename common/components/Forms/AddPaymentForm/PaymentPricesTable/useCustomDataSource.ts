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

export function useCustomDataSource({ preview }) {
  const { paymentData, form } = usePaymentContext()
  const companyId = Form.useWatch('company', form) || paymentData?.company?._id
  const serviceId = Form.useWatch('monthService', form) || paymentData?.service?._id

  const [ds, setDataSource] = useState<IPaymentTableData[]>([])
  const { company } = useCompany({ companyId, skip: preview })
  const { service } = useService({ serviceId, skip: preview })
  const dateMonth = useDateMonth(preview)
  const previousPlacingPrice = usePrevPlacingPrice({ companyId, company, service })

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
    const invoiceDataSource = [
      {
        name: ServiceType.Maintenance,

        dateMonth,
        company,
        service,
      },
      {
        previousPlacingPrice,
        dateMonth,
        company,
        service,
        
        name: ServiceType.Placing,
      },
    ]

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
      if (itemsToDisplay.length > 0) {
        setDataSource(refreshIndexes([...invoiceDataSource, ...itemsToDisplay]))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previousPlacingPrice, company])

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

const useDateMonth = (preview) => {
  const { paymentData, form } = usePaymentContext()
  const serviceId = Form.useWatch('monthService', form) || paymentData?.service
  const { service } = useService({ serviceId, skip: preview })
  return getFormattedDate(
    paymentData?.monthService?.date ||
    paymentData?.invoiceCreationDate ||
    service?.date
  )
}

// TODO: add ts
const usePrevPlacingPrice = ({ companyId, company, service }: { companyId: string; company: any; service: any }) => {
  // TODO: fix. Still prev invoice is wrong
  // issue in invoice creation date, but we needs acutally prev invoice
  const { month, year } = getPreviousMonth(service?.date)
  const { lastInvoice } = useCompanyInvoice({ companyId, month, year })

  const previousPlacingPrice = lastInvoice?.invoice?.find(
    (item) => item.type === ServiceType.Placing
    )?.sum
  const defaultPlacingPrice = company?.totalArea && company?.pricePerMeter && company?.totalArea * company?.pricePerMeter

  return previousPlacingPrice || defaultPlacingPrice
}
