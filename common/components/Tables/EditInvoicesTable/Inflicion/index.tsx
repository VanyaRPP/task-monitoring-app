import { dateToDefaultFormat } from '@common/assets/features/formatDate'
import validator from '@common/assets/features/validators'
import { usePaymentFormData } from '@common/components/Forms/EditPaymentForm'
import { InvoiceComponentProps } from '@common/components/Tables/EditInvoicesTable'
import { ServiceType } from '@utils/constants'
import { toArray, toRoundFixed } from '@utils/helpers'
import { Form, Input, Space, Typography } from 'antd'
import { useEffect, useMemo } from 'react'

export const Name: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
  editable,
  disabled,
}) => {
  return (
    <Space direction="vertical" size={0}>
      <Typography.Text>Інфляція</Typography.Text>
      <Typography.Text type="secondary" style={{ fontSize: '0.75rem' }}>
        {dateToDefaultFormat(new Date().toString())}
      </Typography.Text>
    </Space>
  )
}

/**
 * __With Inflicion:__
 *
 * print as "`prev_month_inflicion`% від `prev_month_sum`"
 *
 * `prev_month_sum` - from previous month payment
 *
 * `prev_month_inflicion` - from previos month service
 */
export const Amount: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
  editable,
  disabled,
}) => {
  const { service, company, prevPayment } = usePaymentFormData(form)

  if (company?.inflicion && service?.inflicionPrice) {
    const prevPlacingInvoice = prevPayment?.invoice.find(
      (invoice) => invoice.type === ServiceType.Placing
    )
    const prevPlacing = prevPlacingInvoice?.sum || 0
    const inflicion = Math.max(service.inflicionPrice - 100, 0)

    return (
      <span>
        {/* {toRoundFixed(inflicion)}% від {toRoundFixed(prevPlacing)} */}
        {toRoundFixed(inflicion)}% від <strong>TODO:</strong>
      </span>
    )
  }
}

/**
 * __With Inflicion:__
 *
 * = `prev_month_sum` * `prev_month_inflicion` / `100`
 *
 * `prev_month_sum` - from previous month payment
 *
 * `prev_month_inflicion` - from previos month service
 */
export const Price: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
  editable,
  disabled,
}) => {
  const name = useMemo(() => toArray<string>(_name), [_name])

  // const { service, company, prevPayment } = usePaymentFormData(form)

  const price = Form.useWatch(['invoice', ...name, 'price'], form)

  // useEffect(() => {
  //   if (company?.inflicion && service?.inflicionPrice) {
  //     const prevPlacingInvoice = prevPayment?.invoice.find(
  //       (invoice) => invoice.type === ServiceType.Placing
  //     )
  //     const rentPrice: number = prevPlacingInvoice?.sum || service?.rentPrice

  //     form.setFieldValue(
  //       ['invoice', ...toArray<string>(_name), 'price'],
  //       (rentPrice * Math.max(service.inflicionPrice - 100, 0)) / 100
  //     )
  //   }
  // }, [form, _name, service, company, prevPayment])

  if (!editable) {
    return <span>{toRoundFixed(price)} грн</span>
  }

  return (
    <Form.Item
      name={[...name, 'price']}
      rules={[validator.required(), validator.min(0)]}
      style={{ margin: 0 }}
    >
      <Input
        type="number"
        placeholder="Значення..."
        disabled={disabled}
        suffix="грн"
      />
    </Form.Item>
  )
}

/**
 * __With Inflicion:__
 *
 * = `current_price`
 */
export const Sum: React.FC<InvoiceComponentProps> = ({ form, name: _name }) => {
  const name = useMemo(() => toArray<string>(_name), [_name])

  const price = Form.useWatch(['invoice', ...name, 'price'], form)
  const sum = Form.useWatch(['invoice', ...name, 'sum'], form)

  useEffect(() => {
    form.setFieldValue(['invoice', ...name, 'sum'], +price)
  }, [form, name, price])

  return <strong>{toRoundFixed(sum)} грн</strong>
}

/**
 * __Формули:__
 *
 * Ціна інфляції = (`Індекс інфляції за попередній місяць у відсотках` - `100`) / `100` * `Ціна оренди за попередній місяць`.
 *
 * __Умови:__
 *
 * Інфляцію дораховувати до оренди тільки компаніям, які мають `inflicion: true`. Для всіх інших стала ціна за кв.м.
 *
 * __Приклад:__
 *
 * Індекс інфляції за попередній місяць = __101__;
 *
 * Оренда за попередній місяць = __10000__;
 *
 * Ціна інфляції = __(101 - 100) / 100 * 10000 = 0.01 * 10000 = 100__;
 */
const Inflicion = {
  Name,
  Amount,
  Price,
  Sum,
}

export default Inflicion
