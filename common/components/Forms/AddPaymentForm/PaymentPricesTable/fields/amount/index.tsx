import { usePaymentContext } from '@common/components/AddPaymentModal'
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
  edit?: boolean
  last?: Boolean
}> = ({ record, edit, last }) => {
  const type = !last ? 'amount' : 'lastAmount'
  const { form } = usePaymentContext()
  const value = Form.useWatch(['invoice', record.name, type], form)

  return (
    <Form.Item
      name={['invoice', record.name, type]}
      initialValue={
        !!record[type] && !isNaN(record[type]) ? Number(record[type]) : 0
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
