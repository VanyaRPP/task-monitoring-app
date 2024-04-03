import { usePaymentContext } from '@common/components/AddPaymentModal'
import { Form, Input } from 'antd'
import { Invoice } from '../..'

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

export const Price: React.FC<{
  record: Invoice
  edit?: boolean
  initialValue?: number
}> = ({ record, edit, initialValue }) => {
  const { form } = usePaymentContext()
  const value = Form.useWatch(['invoice', record.name, 'price'], form)

  return (
    <Form.Item
      name={['invoice', record.name, 'price']}
      initialValue={
        !!record.price || !isNaN(record.price)
          ? Number(record.price)
          : initialValue
          ? initialValue
          : 0
      }
      style={{ flex: 1 }}
      // check for possible UI BUG: `edit: false` and initial value is `undefined | null`
      rules={[{ required: true, message: 'Required' }]}
    >
      {edit ? (
        <Input type="number" />
      ) : (
        (!value || isNaN(value) ? 0 : Number(value)).toFixed(2)
      )}
    </Form.Item>
  )
}
