import { dateToMonthYear } from '@assets/features/formatDate'
import { usePaymentContext } from '@components/AddPaymentModal'
import { useInvoiceCurrency } from '@modules/hooks/useInvoiceCurrency'
import { InvoiceComponentProps } from '@components/Tables/EditInvoiceTable'
import { ServiceType } from '@utils/constants'
import {
  currencyWithUnit,
  toArray,
  toFirstUpperCase,
  toRoundFixed,
} from '@utils/helpers'
import validator from '@utils/validator'
import { Form, Input, Typography } from 'antd'
import { useMemo } from 'react'
import InvoiceRowName from '../InvoiceRowName'
import useSyncSum from '../useSyncSum'

export const Name: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
  editable,
  disabled,
  record,
}) => {
  const name = useMemo(() => toArray<string>(_name), [_name])
  const price = Form.useWatch(['invoice', ...name, 'price'], form)
  const { prevService } = usePaymentContext()

  return (
    <InvoiceRowName
      form={form}
      name={name}
      record={record}
      serviceType={ServiceType.Inflicion}
      editable={editable}
      disabled={disabled}
      label="Інфляція"
      middle={price > 0 ? '(донарах. інд. інф.)' : '(незмінна)'}
      subtitle={toFirstUpperCase(dateToMonthYear(prevService?.date))}
    />
  )
}

export const Amount: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
  editable,
}) => {
  const name = useMemo(() => toArray<string>(_name), [_name])

  const { company, prevService, prevPayment } = usePaymentContext()
  const currency = useInvoiceCurrency()

  const prevPlacingInvoice = useMemo(() => {
    return prevPayment?.invoice.find(
      (invoice) => invoice.type === ServiceType.Placing
    )
  }, [prevPayment])

  const price = Form.useWatch(['invoice', ...name, 'price'], form)

  const rentPrice = useMemo(() => {
    return (
      prevPlacingInvoice?.sum ||
      company?.totalArea * (company?.pricePerMeter || prevService?.rentPrice)
    )
  }, [prevPlacingInvoice, company, prevService])

  const inflicion = useMemo(() => {
    return Math.max(prevService?.inflicionPrice - 100, 0)
  }, [prevService])

  const isInitial = useMemo(() => {
    return toRoundFixed(price) === toRoundFixed((rentPrice / 100) * inflicion)
  }, [price, rentPrice, inflicion])

  if (company?.inflicion && prevService?.inflicionPrice) {
    if (!editable && !isInitial) return null
    return (
      <Typography.Text delete={!isInitial}>
        {toRoundFixed(inflicion)}% від{' '}
        {currencyWithUnit(toRoundFixed(rentPrice), currency)}
      </Typography.Text>
    )
  }

  if (company?.inflicion && !prevService?.inflicionPrice) {
    return <>Інфляція за попередній місяць невідома</>
  }

  return null
}

export const Price: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
  editable,
  disabled,
}) => {
  const name = useMemo(() => toArray<string>(_name), [_name])

  const price = Form.useWatch(['invoice', ...name, 'price'], form)
  const currency = useInvoiceCurrency()

  if (!editable) {
    return <span>{currencyWithUnit(toRoundFixed(price), currency)}</span>
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
        suffix={currencyWithUnit('', currency)}
      />
    </Form.Item>
  )
}

export const Sum: React.FC<InvoiceComponentProps> = ({ form, name: _name }) => {
  const name = useMemo(() => toArray<string>(_name), [_name])

  const price = Form.useWatch(['invoice', ...name, 'price'], form)
  const sum = Form.useWatch(['invoice', ...name, 'sum'], form)
  const currency = useInvoiceCurrency()

  useSyncSum(form!, name, +price || 0)

  return <strong>{currencyWithUnit(toRoundFixed(sum), currency)}</strong>
}

const Inflicion = {
  Name,
  Amount,
  Price,
  Sum,
}

export default Inflicion
