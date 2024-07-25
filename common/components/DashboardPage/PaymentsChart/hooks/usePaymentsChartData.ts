import { useMemo } from 'react'
import { getPaymentsChartData } from '../utils/paymentsChartHelper'

export const usePaymentsChartData = (payments) => {
  return useMemo(() => {
    return getPaymentsChartData(payments)
  }, [payments])
}
