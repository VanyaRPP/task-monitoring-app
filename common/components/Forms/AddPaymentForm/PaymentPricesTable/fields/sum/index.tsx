import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { usePaymentContext } from '@common/components/AddPaymentModal'
import { parseStringToFloat } from '@utils/helpers'
import { useEffect } from 'react'

export { default as Cleaning } from './Cleaning'
export { default as Custom } from './Custom'
export { default as Discount } from './Discount'
export { default as Electricity } from './Electricity'
export { default as GarbageCollector } from './GarbageCollector'
export { default as Inflicion } from './Inflicion'
export { default as Maintenance } from './Maintenance'
export { default as Placing } from './Placing'
export { default as Unknown } from './Unknown'
export { default as Water } from './Water'
export { default as WaterPart } from './WaterPart'

export const Sum: React.FC<{
  record: IPaymentField & { key: string }
}> = ({ record }) => {
  const { form } = usePaymentContext()

  const { lastAmount, amount, price } = record

  useEffect(() => {
    const quantity: number = !isNaN(record.amount)
      ? !isNaN(record.lastAmount)
        ? +amount - +lastAmount
        : +amount
      : 1

    form.setFieldValue(['invoice', record.key, 'sum'], quantity * +price || 0)
  }, [
    form,
    lastAmount,
    amount,
    price,
    record.key,
    record.amount,
    record.lastAmount,
  ])

  return <>{parseStringToFloat(record.sum)} грн</>
}
