import { usePaymentContext } from '@common/components/AddPaymentModal'
import { Form } from 'antd'
import { useEffect } from 'react'
import { Invoice } from '../..'

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
  record: Invoice
}> = ({ record }) => {
  const { form } = usePaymentContext()

  const { lastAmount, amount, price } = record

  useEffect(() => {
    const quantity: number =
      'amount' in record
        ? 'lastAmount' in record
          ? +amount - +lastAmount
          : +amount
        : 1

    form.setFieldValue(['invoice', record.key, 'sum'], quantity * +price || 0)
  }, [lastAmount, amount, price])

  return (
    <Form.Item noStyle>
      <>{('sum' in record ? +record.sum : +record.price).toFixed(2)} грн</>
    </Form.Item>
  )
}
