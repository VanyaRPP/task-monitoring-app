import { usePaymentContext } from '@common/components/AddPaymentModal'
import { Invoice } from '@common/components/Forms/AddPaymentForm/PaymentPricesTable'
import { Form } from 'antd'
import { useEffect } from 'react'

export { default as Cleaning } from './Cleaning'
export { default as Custom } from './Custom'
export { default as Discount } from './Discount'
export { default as Electricity } from './Electricity'
export { default as GarbageCollector } from './GarbageCollector'
export { default as Inflicion } from './Inflicion'
export { default as Maintenance } from './Maintenance'
export { default as Placing } from './Placing'
export { default as Water } from './Water'
export { default as WaterPart } from './WaterPart'

export const Sum: React.FC<{ record: Invoice }> = ({ record }) => {
  const { form } = usePaymentContext()

  const lastAmountName = ['invoice', record.name, 'lastAmount']
  const lastAmount = Form.useWatch(lastAmountName, form)

  const amountName = ['invoice', record.name, 'amount']
  const amount = Form.useWatch(amountName, form)

  const priceName = ['invoice', record.name, 'price']
  const price = Form.useWatch(priceName, form)

  const amountDiff =
    !amount && !lastAmount ? 1 : lastAmount ? amount - lastAmount : amount

  useEffect(() => {
    form.setFieldValue(['invoice', record.name, 'sum'], amountDiff * price)
  }, [amountDiff, price, form])

  return (
    <Form.Item name={['invoice', record.name, 'sum']}>
      <>{(amountDiff * price || 0).toFixed(2)} грн</>
    </Form.Item>
  )
}
