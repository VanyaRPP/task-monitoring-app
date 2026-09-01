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

// Тариф і втрати беруться з САМОГО рядка інвойсу (як в Утриманні), а не з
// місячної послуги: для нативної колонки в рядку і так лежить
// service.electricityPrice, а кастомний лічильник несе свій тариф (ціна
// компанії > ціна з місячної послуги, див. resolveTypedServiceTariff).
const useRowTariff = (name: number, fieldName: string) => {
  const { form, service } = useInvoicesPaymentContext()

  const rowPrice = Form.useWatch(
    ['payments', name, 'invoice', fieldName, 'price'],
    form
  )
  const rowLosses = Form.useWatch(
    ['payments', name, 'invoice', fieldName, 'losses'],
    form
  )

  const price = Number(rowPrice ?? service?.electricityPrice ?? 0) || 0
  const losses = Number(rowLosses ?? service?.losses ?? 0) || 0

  return { form, price, losses }
}

export const LossElectricitySum: React.FC<Keyed> = ({
  name,
  fieldName = ServiceType.Electricity,
}) => {
  const { form } = useInvoicesPaymentContext()
  const { losses } = useRowTariff(name, fieldName)
  const lastAmount: number =
    Form.useWatch(
      ['payments', name, 'invoice', fieldName, 'lastAmount'],
      form
    ) ?? 0
  const amount: number =
    Form.useWatch(['payments', name, 'invoice', fieldName, 'amount'], form) ?? 0
  return (
    <Space>
      {losses > 0 && amount > 0 && (
        <Typography.Text type="secondary" style={{ fontWeight: 'lighter' }}>
          {(
            amount -
            lastAmount +
            (amount - lastAmount) * (losses / 100)
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
  const { form } = useInvoicesPaymentContext()
  const { losses } = useRowTariff(name, fieldName)
  const lastAmount: number =
    Form.useWatch(
      ['payments', name, 'invoice', fieldName, 'lastAmount'],
      form
    ) ?? 0
  const amount: number =
    Form.useWatch(['payments', name, 'invoice', fieldName, 'amount'], form) ?? 0
  return (
    <Space>
      {losses > 0 && amount > 0 && (
        <Typography.Text type="secondary" style={{ fontWeight: 'lighter' }}>
          {amount - lastAmount} + ({losses}%)
        </Typography.Text>
      )}
    </Space>
  )
}

// `price` — тариф конкретної послуги (для кастомної колонки передається з
// column.config); без нього показує тариф електрики місячної послуги.
export const ElectricitySumTitle: React.FC<{ price?: number }> = ({
  price,
}) => {
  const { service } = useInvoicesPaymentContext()
  const tariff = price ?? service?.electricityPrice

  return (
    <Space>
      <Typography.Text>Загальне</Typography.Text>
      {!!tariff && (
        <Typography.Text type="secondary" style={{ fontWeight: 'lighter' }}>
          {toRoundFixed(tariff)} грн/кВт
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
  const { form, price, losses } = useRowTariff(name, fieldName)

  const lastAmount: number =
    Form.useWatch(
      ['payments', name, 'invoice', fieldName, 'lastAmount'],
      form
    ) ?? 0
  const amount: number =
    Form.useWatch(['payments', name, 'invoice', fieldName, 'amount'], form) ?? 0
  const costAmount = amount - lastAmount
  const loss = costAmount + costAmount * (losses / 100)

  useEffect(() => {
    const sum =
      losses > 0
        ? +toRoundFixed(loss * +price.toFixed(2))
        : +toRoundFixed((+amount - +lastAmount) * price)

    form.setFieldValue(['payments', name, 'invoice', fieldName, 'sum'], sum)
  }, [form, name, fieldName, amount, lastAmount, price, losses, loss])

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
