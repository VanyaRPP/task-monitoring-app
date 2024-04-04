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
export { default as Unknown } from './Unknown'
export { default as Water } from './Water'
export { default as WaterPart } from './WaterPart'

export const Price: React.FC<{
  record: Invoice
  preview?: boolean
}> = ({ record, preview }) => {
  return (
    <Form.Item
      name={[record.key, 'price']}
      style={{ flex: 1 }}
      // check for possible UI BUG: `edit: false` and initial value is `undefined | null`
      rules={[{ required: true, message: 'Required' }]}
    >
      {!preview ? <Input type="number" /> : (+record.price || 0).toFixed(2)}
    </Form.Item>
  )
}
