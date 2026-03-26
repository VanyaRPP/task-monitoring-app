import { useEffect } from 'react'
import { Form, Space, Typography, InputNumber, Input } from 'antd'
import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'
import { ServiceType } from '@utils/constants'
import { inputNumberParser, toRoundFixed } from '@utils/helpers'
import validator from '@utils/validator'

export const GarbageCollectorSumTitle: React.FC = () => {
  const { service } = useInvoicesPaymentContext()

  return (
    <Space>
      <Typography.Text>Загальне</Typography.Text>
      {!!service?.waterPrice && (
        <Typography.Text type="secondary" style={{ fontWeight: 'lighter' }}>
          {toRoundFixed(service.garbageCollectorPrice)} грн
        </Typography.Text>
      )}
    </Space>
  )
}

export const GarbageCollectorAmount: React.FC<{ name: number }> = ({ name }) => {
  const { form } = useInvoicesPaymentContext()

  const garbageCollector: boolean =
    Form.useWatch(['payments', name, 'company', 'garbageCollector'], form) ??
    false

  if (garbageCollector) {
    return (
      <Form.Item
        name={[name, 'company', 'rentPart']}
        style={{ margin: 0 }}
        rules={[validator.required(), validator.min(0)]}
      >
        <Input type="number" disabled />
      </Form.Item>
    )
  }
}

export const GarbageCollectorSum: React.FC<{ name: number }> = ({ name }) => {
  const { form } = useInvoicesPaymentContext()

  const garbageCollector: boolean =
    Form.useWatch(['payments', name, 'company', 'garbageCollector'], form) ??
    false

  const price: number =
    Form.useWatch(
      ['payments', name, 'invoice', ServiceType.GarbageCollector, 'price'],
      form
    ) ?? 0

  useEffect(() => {
    if (garbageCollector) {
      const sum = +toRoundFixed(price ?? 0)
      form.setFieldValue(
        ['payments', name, 'invoice', ServiceType.GarbageCollector, 'sum'],
        sum
      )
    }
  }, [form, name, price, garbageCollector])

  if (garbageCollector) {
    return (
      <Form.Item
        name={[name, 'invoice', ServiceType.GarbageCollector, 'price']}
        style={{ margin: 0 }}
        rules={[validator.required(), validator.min(0)]}
      >
        <InputNumber parser={inputNumberParser} />
      </Form.Item>
    )
  }
}