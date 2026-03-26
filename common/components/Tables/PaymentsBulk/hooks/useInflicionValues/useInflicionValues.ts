import { useMemo } from 'react'
import { Form } from 'antd'
import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { ServiceType } from '@utils/constants'
import { usePrevPayment } from '@common/components/Tables/PaymentsBulk/hooks/usePrevPayment/usePrevPayment'

export const useInflicionValues = (
  name: number
): {
  previousPlacingPrice: number
  inflicionAmount: number
} => {
  const { form, service, prevService } = useInvoicesPaymentContext()

  const prevPayment = usePrevPayment(name)

  const company: IRealestate | undefined = Form.useWatch(
    ['payments', name, 'company'],
    form
  )

  const previousPlacingPrice = useMemo(() => {
    return (
      prevPayment?.invoice?.find((item) => item.type === ServiceType.Placing)?.sum ||
      (company?.totalArea || 0) * ((company?.pricePerMeter || 0) || (service?.rentPrice || 0))
    )
  }, [prevPayment, company, service])

  const inflicionAmount = useMemo(() => {
    return (
      previousPlacingPrice *
      (((prevService?.inflicionPrice || 100) - 100) / 100)
    )
  }, [previousPlacingPrice, prevService])

  return {
    previousPlacingPrice,
    inflicionAmount: inflicionAmount < 0 ? 0 : inflicionAmount,
  }
}