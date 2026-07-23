import { usePaymentContext } from '@components/AddPaymentModal'
import { useInvoiceCurrency } from '@modules/hooks/useInvoiceCurrency'
import {
  InvoiceComponentProps,
  InvoiceType,
} from '@components/Tables/EditInvoiceTable'
import { ServiceType } from '@utils/constants'
import { currencyWithUnit, toArray, toRoundFixed } from '@utils/helpers'
import validator from '@utils/validator'
import { Form, Input, Typography } from 'antd'
import { useEffect, useMemo } from 'react'
import InvoiceRowName from '../InvoiceRowName'
import useSyncSum from '../useSyncSum'

export const Name: React.FC<InvoiceComponentProps> = (props) => {
  const { company } = usePaymentContext()

  return (
    <InvoiceRowName
      {...props}
      serviceType={ServiceType.Placing}
      label="Розміщення"
      middle={company?.inflicion ? '(без врах. інд. інф.)' : undefined}
    />
  )
}

export const Amount: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
  editable,
  disabled,
}) => {
  const name = useMemo(() => toArray<string>(_name), [_name])
  const { company, prevService, prevPayment } = usePaymentContext()
  const currency = useInvoiceCurrency()

  const invoices: InvoiceType[] = Form.useWatch(['invoice'], form)
  const amount = Form.useWatch(['invoice', ...name, 'amount'], form)
  const price = Form.useWatch(['invoice', ...name, 'price'], form)

  const inflicionInvoice = useMemo(() => {
    return invoices?.find((invoice) => invoice.type === ServiceType.Inflicion)
  }, [invoices])

  const prevPlacingInvoice = useMemo(() => {
    return prevPayment?.invoice.find(
      (invoice) => invoice.type === ServiceType.Placing
    )
  }, [prevPayment])

  const rentPrice = useMemo(() => {
    if (typeof prevPlacingInvoice?.sum === 'number') {
      return prevPlacingInvoice.sum
    }
    const area = company?.totalArea ?? 1
    const pricePerMeter = company?.pricePerMeter ?? prevService?.rentPrice ?? 0
    return area * pricePerMeter
  }, [prevPlacingInvoice, company, prevService])

  const calculatedInitialPrice = useMemo(() => {
    return +toRoundFixed(rentPrice + (inflicionInvoice?.sum ?? 0))
  }, [rentPrice, inflicionInvoice])

  const isInitial = useMemo(() => {
    return toRoundFixed(price) === toRoundFixed(calculatedInitialPrice)
  }, [price, calculatedInitialPrice])

  // Old-style invoices (created before inflicion was enabled) carry a valid area
  // in `amount`. Only apply inflicion UI to invoices that have no area field.
  const hasAmount = !isNaN(+amount) && +amount > 0

  if (company?.inflicion && !hasAmount && !prevService?.inflicionPrice) {
    return <span>Інфляція за попередній місяць невідома</span>
  }

  if (company?.inflicion && !hasAmount) {
    if (!editable && !isInitial) return null
    return (
      <Typography.Text delete={!isInitial}>
        {currencyWithUnit(toRoundFixed(rentPrice), currency)} +{' '}
        {currencyWithUnit(toRoundFixed(inflicionInvoice?.sum), currency)} ={' '}
      </Typography.Text>
    )
  }

  if (!editable) {
    return (
      <span>
        {toRoundFixed(amount)} м<sup>2</sup>
      </span>
    )
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
  const { company, prevService, prevPayment } = usePaymentContext()
  const currency = useInvoiceCurrency()
  const invoices: InvoiceType[] = Form.useWatch(['invoice'], form)
  const watchedPrice = Form.useWatch(['invoice', ...name, 'price'], form)
  const watchedAmount = Form.useWatch(['invoice', ...name, 'amount'], form)
  const changed = Form.useWatch(['invoiceMeta', 'changed'], form) ?? false

  // Old-style invoice: has a valid area field → was created with m²×price formula.
  // Do not apply inflicion-formula overrides to these rows.
  const hasAmount = !isNaN(+watchedAmount) && +watchedAmount > 0
  const inflicionInvoice = useMemo(() => {
    return invoices?.find((invoice) => invoice.type === ServiceType.Inflicion)
  }, [invoices])

  const prevPlacingInvoice = useMemo(() => {
    return prevPayment?.invoice.find(
      (invoice) => invoice.type === ServiceType.Placing
    )
  }, [prevPayment])

  const rentPrice = useMemo(() => {
    if (typeof prevPlacingInvoice?.sum === 'number') {
      return prevPlacingInvoice.sum
    }
    const area = company?.totalArea ?? 1
    const pricePerMeter = company?.pricePerMeter ?? prevService?.rentPrice ?? 0
    return area * pricePerMeter
  }, [prevPlacingInvoice, company, prevService])

  const calculatedInitialPrice = useMemo(() => {
    return +toRoundFixed(rentPrice + (inflicionInvoice?.sum ?? 0))
  }, [rentPrice, inflicionInvoice])

  useEffect(() => {
    if (
      company?.inflicion &&
      !hasAmount &&
      editable &&
      !changed &&
      inflicionInvoice?.sum !== undefined
    ) {
      Promise.resolve().then(() => {
        form.setFieldValue(
          ['invoice', ...name, 'price'],
          calculatedInitialPrice
        )
      })
    }
  }, [
    company,
    hasAmount,
    editable,
    changed,
    inflicionInvoice?.sum,
    calculatedInitialPrice,
    form,
    name,
  ])

  const suffix = useMemo(() => {
    return company?.inflicion && !hasAmount ? (
      <span>{currencyWithUnit('', currency)}</span>
    ) : (
      <span>
        {currencyWithUnit('', currency)}/м<sup>2</sup>
      </span>
    )
  }, [company, hasAmount, currency])

  if (!editable) {
    return (
      <span>
        {toRoundFixed(watchedPrice)} {suffix}
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
        value={watchedPrice}
        onChange={() => {
          form.setFieldValue(['invoiceMeta', 'changed'], true)
        }}
      />
    </Form.Item>
  )
}

export const Sum: React.FC<InvoiceComponentProps> = ({ form, name: _name }) => {
  const name = useMemo(() => toArray<string>(_name), [_name])
  const currency = useInvoiceCurrency()

  const price = Form.useWatch(['invoice', ...name, 'price'], form)
  const amount = Form.useWatch(['invoice', ...name, 'amount'], form)
  const sum = Form.useWatch(['invoice', ...name, 'sum'], form)

  // If the row has a valid area (m²) it was created with the m²×price formula —
  // use price×amount regardless of whether the company now has inflicion enabled.
  // Inflicion-style rows have no amount, so fall back to price directly.
  const hasAmount = !isNaN(+amount) && +amount > 0
  useSyncSum(form!, name, hasAmount ? +price * +amount : +price)

  return <strong>{currencyWithUnit(toRoundFixed(sum), currency)}</strong>
}

const Placing = {
  Name,
  Amount,
  Price,
  Sum,
}

export default Placing
