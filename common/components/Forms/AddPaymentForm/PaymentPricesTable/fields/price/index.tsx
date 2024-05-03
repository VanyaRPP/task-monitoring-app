import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { ServiceType } from '@utils/constants'
import { toRoundFixed } from '@utils/helpers'
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
  rules?: any[]
}> = ({ record, preview, rules = [] }) => {
  if (preview) {
    return <span>{toRoundFixed(record.price)}</span>
  }

  return (
    <Form.Item
      name={[record.key, 'price']}
      rules={[
        {
          validator: (_, value) => {
            if (isNaN(value) || value === null || !value) {
              return Promise.reject(new Error('Required'))
            }

            if (record.type !== ServiceType.Discount && value < 0) {
              return Promise.reject(new Error('Не менше 0'))
            }

            if (record.type === ServiceType.Discount && value > 0) {
              return Promise.reject(new Error('Не більше 0'))
            }

            return Promise.resolve()
          },
        },
        ,
        ...rules,
      ]}
    >
      <Input type="number" />
    </Form.Item>
  )
}
