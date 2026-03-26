import { useEffect } from 'react'
import { Form, Space, Typography, Input, InputNumber } from 'antd'
import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'
import { ServiceType } from '@utils/constants'
import { toRoundFixed, inputNumberParser } from '@utils/helpers'
import validator from '@utils/validator'

export const WaterSumTitle: React.FC = () => {
  const { service } = useInvoicesPaymentContext()

  return (
    <Space>
      <Typography.Text>Загальне</Typography.Text>
      {!!service?.waterPrice && (
        <Typography.Text type="secondary" style={{ fontWeight: 'lighter' }}>
          {toRoundFixed(service.waterPrice)} грн/м<sup>3</sup>
        </Typography.Text>
      )}
    </Space>
  )
}

export const WaterAmount: React.FC<{ name: number; last?: boolean }> = ({
  name,
  last = false,
}) => {
  const { form } = useInvoicesPaymentContext()

  const waterPart: number =
    Form.useWatch(['payments', name, 'company', 'waterPart'], form) ?? 0

  if (!waterPart) {
    return (
      <Form.Item
        name={[
          name,
          'invoice',
          ServiceType.Water,
          last ? 'lastAmount' : 'amount',
        ]}
        style={{ margin: 0 }}
        rules={[validator.required(), validator.min(0)]}
      >
        <InputNumber parser={inputNumberParser} />
      </Form.Item>
    )
  }
}

export const WaterSum: React.FC<{ name: number }> = ({ name }) => {
  const { form, service } = useInvoicesPaymentContext()

  const lastAmount: number =
    Form.useWatch(
      ['payments', name, 'invoice', ServiceType.Water, 'lastAmount'],
      form
    ) ?? 0
  const amount: number =
    Form.useWatch(
      ['payments', name, 'invoice', ServiceType.Water, 'amount'],
      form
    ) ?? 0

  const waterPart: number =
    Form.useWatch(['payments', name, 'company', 'waterPart'], form) ?? 0

  useEffect(() => {
    if (!waterPart) {
      const price = service?.waterPrice ?? 0
      const sum = +toRoundFixed((+amount - +lastAmount) * price)

      form.setFieldValue(
        ['payments', name, 'invoice', ServiceType.Water, 'sum'],
        sum
      )
    }
  }, [form, name, amount, lastAmount, service, waterPart])

  if (!waterPart) {
    return (
      <Form.Item
        name={[name, 'invoice', ServiceType.Water, 'sum']}
        style={{ margin: 0 }}
        rules={[validator.required(), validator.min(0)]}
      >
        <Input type="number" disabled />
      </Form.Item>
    )
  }
}
