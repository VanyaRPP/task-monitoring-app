import { useEffect } from 'react'
import { Form, Space, Typography, InputNumber, Input } from 'antd'
import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'
import { ServiceType } from '@utils/constants'
import { inputNumberParser, toRoundFixed } from '@utils/helpers'
import validator from '@utils/validator'

// The invoice key these cells read/write. Defaults to ServiceType.Electricity so
// the native communal column is unchanged; a per-domain custom "electricity"
// service passes its own fieldName so several meters can coexist while sharing
// the domain's electricity tariff + losses.
type Keyed = { name: number; fieldName?: string }

export const LossElectricitySum: React.FC<Keyed> = ({
  name,
  fieldName = ServiceType.Electricity,
}) => {
  const { form, service } = useInvoicesPaymentContext()
  const lastAmount: number =
    Form.useWatch(
      ['payments', name, 'invoice', fieldName, 'lastAmount'],
      form
    ) ?? 0
  const amount: number =
    Form.useWatch(['payments', name, 'invoice', fieldName, 'amount'], form) ?? 0
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

export const LossElectricityPrice: React.FC<Keyed> = ({
  name,
  fieldName = ServiceType.Electricity,
}) => {
  const { form, service } = useInvoicesPaymentContext()
  const lastAmount: number =
    Form.useWatch(
      ['payments', name, 'invoice', fieldName, 'lastAmount'],
      form
    ) ?? 0
  const amount: number =
    Form.useWatch(['payments', name, 'invoice', fieldName, 'amount'], form) ?? 0
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

export const ElectricityAmount: React.FC<Keyed & { last?: boolean }> = ({
  name,
  fieldName = ServiceType.Electricity,
  last = false,
}) => {
  return (
    <Form.Item
      name={[name, 'invoice', fieldName, last ? 'lastAmount' : 'amount']}
      style={{ margin: 0 }}
      rules={[validator.required(), validator.min(0)]}
    >
      <InputNumber parser={inputNumberParser} style={{ width: 'auto' }} />
    </Form.Item>
  )
}

export const ElectricitySum: React.FC<Keyed> = ({
  name,
  fieldName = ServiceType.Electricity,
}) => {
  const { form, service } = useInvoicesPaymentContext()

  const lastAmount: number =
    Form.useWatch(
      ['payments', name, 'invoice', fieldName, 'lastAmount'],
      form
    ) ?? 0
  const amount: number =
    Form.useWatch(['payments', name, 'invoice', fieldName, 'amount'], form) ?? 0
  const costAmount = amount - lastAmount
  const loss = costAmount + costAmount * (service?.losses / 100)

  useEffect(() => {
    const price = service?.electricityPrice ?? 0
    const sum =
      service?.losses > 0
        ? +toRoundFixed(loss * +price.toFixed(2))
        : +toRoundFixed((+amount - +lastAmount) * price)

    form.setFieldValue(['payments', name, 'invoice', fieldName, 'sum'], sum)
  }, [form, name, fieldName, amount, lastAmount, service, loss])

  return (
    <Form.Item
      name={[name, 'invoice', fieldName, 'sum']}
      style={{ margin: 0 }}
      rules={[validator.required(), validator.min(0)]}
    >
      <Input type="number" disabled />
    </Form.Item>
  )
}
