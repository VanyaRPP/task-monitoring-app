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
  name,
  editable,
  disabled,
}) => {
  return (
    <Space direction="vertical" size={0}>
      <Typography.Text>Розміщення</Typography.Text>
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
  const name = useMemo(() => toArray<string>(_name), [_name])

  const { service, company, prevPayment } = usePaymentFormData(form)

  const amount = Form.useWatch(['invoice', ...name, 'amount'], form)

  if (company?.inflicion && !service?.inflicionPrice) {
    return <span>Інфляція за попередній місяць невідома</span>
  }

  if (company?.inflicion) {
    const prevPlacingInvoice = prevPayment?.invoice.find(
      (invoice) => invoice.type === ServiceType.Placing
    )
    const rentPrice = prevPlacingInvoice?.sum || service?.rentPrice

    return (
      <span>
        {/* {toRoundFixed(service.inflicionPrice)}% від {toRoundFixed(rentPrice)} */}
        {toRoundFixed(service.inflicionPrice)}% від <strong>TODO:</strong>
      </span>
    )
  }

  if (!editable) {
    return <span>{toRoundFixed(amount)}</span>
  }

  return (
    <Form.Item
      name={[...name, 'amount']}
      rules={[validator.required()]}
      style={{ margin: 0 }}
    >
      <Input
        type="number"
        placeholder="Значення..."
        disabled={disabled}
        suffix={
          <span>
            м<sup>2</sup>
          </span>
        }
      />
    </Form.Item>
  )
}

/**
 * __With Inflicion:__
 *
 * = `prev_month_sum` * `prev_month_inflicion`
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

  const { service, company, prevPayment } = usePaymentFormData(form)

  const price = Form.useWatch(['invoice', ...name, 'price'], form)

  // useEffect(() => {
  //   if (company?.inflicion && service?.inflicionPrice) {
  //     const prevPlacingInvoice = prevPayment?.invoice.find(
  //       (invoice) => invoice.type === ServiceType.Placing
  //     )
  //     const rentPrice: number = prevPlacingInvoice?.sum || service?.rentPrice
  //     const inflicion = service.inflicionPrice / 100

  //     form.setFieldValue(
  //       ['invoice', ...name, 'price'],
  //       +toRoundFixed(rentPrice * inflicion)
  //     )
  //   }
  // }, [form, name, service, company, prevPayment])

  const suffix = useMemo(() => {
    return company?.inflicion ? (
      <span>грн</span>
    ) : (
      <span>
        грн/м<sup>2</sup>
      </span>
    )
  }, [company])

  if (!editable) {
    return (
      <span>
        {toRoundFixed(price)} {suffix}
      </span>
    )
  }

  return (
    <Form.Item
      name={[...name, 'price']}
      rules={[validator.required()]}
      style={{ margin: 0 }}
    >
      <Input
        type="number"
        placeholder="Значення..."
        disabled={disabled}
        suffix={suffix}
      />
    </Form.Item>
  )
}

/**
 * __With Inflicion:__
 *
 * = `current_price`
 *
 * __Without inflicion:__
 *
 * = `current_price` * `current_amount`
 */
export const Sum: React.FC<InvoiceComponentProps> = ({ form, name: _name }) => {
  const name = useMemo(() => toArray<string>(_name), [_name])

  const { company } = usePaymentFormData(form)

  const price = Form.useWatch(['invoice', ...name, 'price'], form)
  const amount = Form.useWatch(['invoice', ...name, 'amount'], form)
  const sum = Form.useWatch(['invoice', ...name, 'sum'], form)

  useEffect(() => {
    form.setFieldValue(
      ['invoice', ...name, 'sum'],
      company?.inflicion ? +price : +price * +amount
    )
  }, [form, name, price, amount, company])

  return <strong>{toRoundFixed(sum)} грн</strong>
}

/**
 * __Формули:__
 *
 * Оренда = `Індекс інфляції за попередній місяць у відсотках` * `Ціна за попередній місяць`.
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
 * Оренда = __101 / 100 * 10000 = 1.01 * 10000 = 10100__;
 */
const Placing = {
  Name,
  Amount,
  Price,
  Sum,
}

export default Placing
