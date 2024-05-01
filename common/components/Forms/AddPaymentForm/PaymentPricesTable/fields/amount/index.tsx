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
export { default as Water } from './Water'
export { default as WaterPart } from './WaterPart'

export const Amount: React.FC<{
  record: IPaymentField & { key: string }
  preview?: boolean
  last?: boolean
  rules?: any[]
}> = ({ record, preview, last, rules = [] }) => {
  const type = !last ? 'amount' : 'lastAmount'

  if (preview) {
    return <span style={{ flex: 1 }}>{record[type].toRoundFixed()}</span>
  }

  return (
    <Form.Item
      name={[record.key, type]}
      style={{ flex: 1 }}
      rules={[
        {
          validator: (_, value) => {
            if (isNaN(value) || value === null || !value) {
              return Promise.reject(new Error('Required'))
            }

            if (type === 'lastAmount' && value < 0) {
              return Promise.reject(new Error('Не менше 0'))
            }

            if (type !== 'lastAmount' && value <= 0) {
              return Promise.reject(new Error('Більше 0'))
            }

            return Promise.resolve()
          },
        },
        ...rules,
      ]}
    >
      <Input type="number" />
    </Form.Item>
  )
}
