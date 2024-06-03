import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { parseStringToFloat } from '@utils/helpers'
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
  record: IPaymentField & { key: string }
  preview?: boolean
  last?: boolean
}> = ({ record, preview, last }) => {
  const type = !last ? 'amount' : 'lastAmount'

  if (preview) {
    return <span style={{ flex: 1 }}>{parseStringToFloat(record[type])}</span>
  }

  return (
    <Form.Item
      name={[record.key, type]}
      style={{ flex: 1 }}
      rules={[{ required: true, message: 'Required' }]}
    >
      <Input type="number" />
    </Form.Item>
  )
}
