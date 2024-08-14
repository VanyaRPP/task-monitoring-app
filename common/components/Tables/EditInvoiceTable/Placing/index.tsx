import { dateToMonthYear } from '@assets/features/formatDate'
import { usePaymentContext } from '@components/AddPaymentModal'
import {
  InvoiceComponentProps,
  InvoiceType,
} from '@components/Tables/EditInvoiceTable'
import { ServiceType } from '@utils/constants'
import { toArray, toFirstUpperCase, toRoundFixed } from '@utils/helpers'
import validator from '@utils/validator'
import { Form, Input, Space, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react'

export const Name: React.FC<InvoiceComponentProps> = ({
  form,
  name,
  editable,
  disabled,
}) => {
  const { company, service } = usePaymentContext()

  return (
    <Space direction="vertical" size={0}>
      <Typography.Text>Розміщення</Typography.Text>
      {company?.inflicion && (
        <Typography.Text type="secondary">
          (без врах. інд. інф.)
        </Typography.Text>
      )}
      <Typography.Text type="secondary" style={{ fontSize: '0.75rem' }}>
        {toFirstUpperCase(dateToMonthYear(service?.date))}
      </Typography.Text>
    </Space>
  )
}

export const Amount: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
  editable,
  disabled,
}) => {
  const name = useMemo(() => toArray<string>(_name), [_name])

  const { service, company, prevService, prevPayment } = usePaymentContext()

  const amount = Form.useWatch(['invoice', ...name, 'amount'], form)

  const invoices: InvoiceType[] = Form.useWatch(['invoice'], form)
  const inflicion: InvoiceType | undefined = useMemo(() => {
    return invoices?.find((invoice) => invoice.type === ServiceType.Inflicion)
  }, [invoices])

  if (company?.inflicion && !prevService?.inflicionPrice) {
    return <span>Інфляція за попередній місяць невідома</span>
  }

  if (company?.inflicion) {
    const prevPlacingInvoice = prevPayment?.invoice.find(
      (invoice) => invoice.type === ServiceType.Placing
    )

    const rentPrice =
      prevPlacingInvoice?.sum ||
      company.totalArea * (company.pricePerMeter || service.rentPrice)

    return (
      <span>
        {toRoundFixed(rentPrice)} грн + {toRoundFixed(inflicion?.sum)} грн
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

export const Price: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
  editable,
  disabled,
}) => {
  const name = useMemo(() => toArray<string>(_name), [_name])

  const [changed, setChanged] = useState<boolean>(false)
  const { company, prevPayment } = usePaymentContext()

  const price = Form.useWatch(['invoice', ...name, 'price'], form)
  const invoices: InvoiceType[] = Form.useWatch(['invoice'], form)

  const inflicionInvoice: InvoiceType | undefined = useMemo(() => {
    return invoices?.find((invoice) => invoice.type === ServiceType.Inflicion)
  }, [invoices])

  useEffect(() => {
    if (!company?.inflicion || changed) {
      return
    }

    const prevPlacingInvoice = prevPayment?.invoice.find(
      (invoice) => invoice.type === ServiceType.Placing
    )

    form.setFieldValue(
      ['invoice', ...name, 'price'],
      +toRoundFixed(inflicionInvoice?.sum + prevPlacingInvoice?.sum)
    )
  }, [form, name, prevPayment, company, inflicionInvoice, changed])

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
        onChange={() => setChanged(true)}
      />
    </Form.Item>
  )
}

export const Sum: React.FC<InvoiceComponentProps> = ({ form, name: _name }) => {
  const name = useMemo(() => toArray<string>(_name), [_name])

  const { company } = usePaymentContext()

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

const Placing = {
  Name,
  Amount,
  Price,
  Sum,
}

export default Placing
