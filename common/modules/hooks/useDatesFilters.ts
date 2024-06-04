import { useEffect, useState } from 'react'
import {
  IFilter,
  IGetPaymentResponse,
} from '@common/api/paymentApi/payment.api.types'

const usePaymentDateFilters = (initValue: IGetPaymentResponse) => {
  const [yearsFilter, setYearsFilter] = useState<IFilter[]>([])
  const [monthsFilter, setMonthsFilter] = useState<IFilter[]>([])
  const [payments, setPayments] = useState(initValue)

  useEffect(() => {
    setPayments(initValue)
  }, [initValue])

  useEffect(() => {
    if (!payments?.data) return

    const years = Array.from(
      new Set(
        payments.data
          .filter((payment) => payment.invoiceCreationDate)
          .map((payment) => new Date(payment.invoiceCreationDate).getFullYear())
      )
    ).map((year) => ({ text: year.toString(), value: year }))

    const months = Array.from(
      new Set(
        payments.data
          .filter((payment) => payment.invoiceCreationDate)
          .map(
            (payment) => new Date(payment.invoiceCreationDate).getMonth() + 1
          )
      )
    ).map((month) => ({
      text: new Date(0, month - 1).toLocaleString('default', { month: 'long' }),
      value: month,
    }))

    setYearsFilter(years)
    setMonthsFilter(months)
  }, [payments])

  return {
    yearsFilter,
    monthsFilter,
    setPayments,
  }
}

export default usePaymentDateFilters
