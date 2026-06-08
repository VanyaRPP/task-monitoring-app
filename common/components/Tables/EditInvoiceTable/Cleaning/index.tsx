import { useInvoiceCurrency } from '@modules/hooks/useInvoiceCurrency'
import { InvoiceComponentProps } from '@components/Tables/EditInvoiceTable'
import { currencyWithUnit, toArray, toRoundFixed } from '@utils/helpers'
import validator from '@utils/validator'
import { Form, Input } from 'antd'
import { useMemo } from 'react'
import { ServiceType } from '@utils/constants'
import InvoiceRowName from '../InvoiceRowName'
import useSyncSum from '../useSyncSum'

export const Name: React.FC<InvoiceComponentProps> = (props) => (
  <InvoiceRowName
    {...props}
    serviceType={ServiceType.Cleaning}
    label="Прибирання"
  />
)

export const Amount: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
  editable,
  disabled,
}) => {
  return null
}

export const Price: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
  editable,
  disabled,
}) => {
  const name = useMemo(() => toArray<string>(_name), [_name])
  const currency = useInvoiceCurrency()
  const price = Form.useWatch(['invoice', ...name, 'price'], form)

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

const Cleaning = {
  Name,
  Amount,
  Price,
  Sum,
}

export default Cleaning
