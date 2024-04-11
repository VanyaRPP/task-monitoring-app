import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { Form, Input } from 'antd'

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
  record: IPaymentField & { key: string }
  preview?: boolean
}> = ({ record, preview }) => {
  if (preview) {
    return <span>{(+record.price || 0).toFixed(2)}</span>
  }

  return (
    <Form.Item
      name={[record.key, 'price']}
      rules={[{ required: true, message: 'Required' }]}
    >
      <Input type="number" />
    </Form.Item>
  )
}
