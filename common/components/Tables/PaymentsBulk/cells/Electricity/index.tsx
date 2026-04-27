import { useEffect } from 'react'
import { Form, Space, Typography, InputNumber, Input } from 'antd'
import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'
import { ServiceType } from '@utils/constants'
import { inputNumberParser, toRoundFixed } from '@utils/helpers'
import validator from '@utils/validator'


export const LossElectricitySum: React.FC<{ name: number }> = ({ name }) => {
  const { form, service } = useInvoicesPaymentContext()
  const lastAmount: number =
    Form.useWatch(
      ['payments', name, 'invoice', ServiceType.Electricity, 'lastAmount'],
      form
    ) ?? 0
  const amount: number =
    Form.useWatch(
      ['payments', name, 'invoice', ServiceType.Electricity, 'amount'],
      form
    ) ?? 0
  return (
    <Space>
      {service?.losses && amount > 0 && (
        <Typography.Text type="secondary" style={{ fontWeight: 'lighter' }}>
          {(
            amount -
            lastAmount +
            (amount - lastAmount) * (service?.losses / 100)
          ).toFixed(2)}{' '}
          кВт
        </Typography.Text>
      )}
    </Space>
  )
}

export const LossElectricityPrice: React.FC<{ name: number }> = ({ name }) => {
  const { form, service } = useInvoicesPaymentContext()
  // const test = Form.useWatch(['service', name], form)
  const lastAmount: number =
    Form.useWatch(
      ['payments', name, 'invoice', ServiceType.Electricity, 'lastAmount'],
      form
    ) ?? 0
  const amount: number =
    Form.useWatch(
      ['payments', name, 'invoice', ServiceType.Electricity, 'amount'],
      form
    ) ?? 0
  return (
    <Space>
      {service?.losses && amount > 0 && (
        <Typography.Text type="secondary" style={{ fontWeight: 'lighter' }}>
          {amount - lastAmount} + ({service?.losses}%)
        </Typography.Text>
      )}
    </Space>
  )
}

export const ElectricitySumTitle: React.FC = () => {
  const { service } = useInvoicesPaymentContext()

  return (
    <Space>
      <Typography.Text>Загальне</Typography.Text>
      {!!service?.electricityPrice && (
        <Typography.Text type="secondary" style={{ fontWeight: 'lighter' }}>
          {toRoundFixed(service.electricityPrice)} грн/кВт
        </Typography.Text>
      )}
    </Space>
  )
}

export const ElectricityAmount: React.FC<{ name: number; last?: boolean }> = ({
  name,
  last = false,
}) => {
  return (
    <Form.Item
      name={[
        name,
        'invoice',
        ServiceType.Electricity,
        last ? 'lastAmount' : 'amount',
      ]}
      style={{ margin: 0 }}
      rules={[validator.required(), validator.min(0)]}
    >
      <InputNumber parser={inputNumberParser} style={{ width: 'auto' }} />
    </Form.Item>
  )
}

export const ElectricitySum: React.FC<{ name: number }> = ({ name }) => {
  const { form, service } = useInvoicesPaymentContext()

  const lastAmount: number =
    Form.useWatch(
      ['payments', name, 'invoice', ServiceType.Electricity, 'lastAmount'],
      form
    ) ?? 0
  const amount: number =
    Form.useWatch(
      ['payments', name, 'invoice', ServiceType.Electricity, 'amount'],
      form
    ) ?? 0
  const costAmount = amount - lastAmount
  const loss = costAmount + costAmount * (service?.losses / 100)

  useEffect(() => {
    const price = service?.electricityPrice ?? 0
    const sum =
      service?.losses > 0
        ? +toRoundFixed(loss * +price.toFixed(2))
        : +toRoundFixed((+amount - +lastAmount) * price)

    form.setFieldValue(
      ['payments', name, 'invoice', ServiceType.Electricity, 'sum'],
      sum
    )
  }, [form, name, amount, lastAmount, service])

  return (
    <Form.Item
      name={[name, 'invoice', ServiceType.Electricity, 'sum']}
      style={{ margin: 0 }}
      rules={[validator.required(), validator.min(0)]}
    >
      <Input type="number" disabled />
    </Form.Item>
  )
}