import { Invoice } from '@common/components/Forms/AddPaymentForm/PaymentPricesTable'
import { Form, Input } from 'antd'

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

export const Amount: React.FC<{
  record: Invoice
  preview?: boolean
  last?: Boolean
}> = ({ record, preview, last }) => {
  const type = !last ? 'amount' : 'lastAmount'

  return (
    <Form.Item
      name={[record.key, type]}
      style={{ flex: 1 }}
      // check for possible UI BUG: `edit: false` and initial value is `undefined | null`
      rules={[{ required: true, message: 'Required' }]}
      noStyle={preview}
    >
      {!preview ? <Input type="number" /> : (+record[type]).toFixed(2)}
    </Form.Item>
  )
}
