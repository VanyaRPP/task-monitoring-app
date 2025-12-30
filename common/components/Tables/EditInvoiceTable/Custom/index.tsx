import { dateToMonthYear } from '@assets/features/formatDate'
import { usePaymentContext } from '@components/AddPaymentModal'
import { InvoiceComponentProps } from '@components/Tables/EditInvoiceTable'
import { currencyWithUnit, toArray, toFirstUpperCase, toRoundFixed } from '@utils/helpers'
import validator from '@utils/validator'
import { Form, Input, Space, Typography } from 'antd'
import { useEffect, useMemo } from 'react'

export const Name: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
  editable,
  disabled,
}) => {
  const name = useMemo(() => toArray<string>(_name), [_name])

  const value = Form.useWatch(['invoice', ...name, 'name'], form)
  const type = Form.useWatch(['invoice', ...name, 'type'], form)
  const isCustomService = Form.useWatch(
    ['invoice', ...name, 'customService'],
    form
  )

  const { service } = usePaymentContext()

  if (!editable || type !== 'custom') {
    return (
      <Space direction="vertical" size={0}>
        <Typography.Text>{value || type}</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: '0.75rem' }}>
          {toFirstUpperCase(dateToMonthYear(service?.date))}
        </Typography.Text>
      </Space>
    )
  }

  return (
    <Form.Item
      name={[...name, 'name']}
      rules={[validator.required()]}
      style={{ margin: 0 }}
    >
      {isCustomService ? (
        <Space direction="vertical" size={0}>
          <Typography.Text>{value || 'Назва...'}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: '0.75rem' }}>
            {toFirstUpperCase(dateToMonthYear(service?.date))}
          </Typography.Text>
        </Space>
      ) : (
        <Input placeholder="Назва..." disabled={disabled} />
      )}
    </Form.Item>
  )
}

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
  const isCustomService = Form.useWatch(['invoice', ...name, 'name'], form)
  const price = Form.useWatch(['invoice', ...name, 'price'], form)
  const { company } = usePaymentContext()

  if (!editable) {
    return <span>{currencyWithUnit(toRoundFixed(price), company)}</span>
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
        suffix={currencyWithUnit('', company)}
      />
    </Form.Item>
  )
}

export const Sum: React.FC<InvoiceComponentProps> = ({ form, name: _name }) => {
  const name = useMemo(() => toArray<string>(_name), [_name])

  const price = Form.useWatch(['invoice', ...name, 'price'], form)
  const sum = Form.useWatch(['invoice', ...name, 'sum'], form)
  const { company } = usePaymentContext()
  
  useEffect(() => {
    form.setFieldValue(['invoice', ...name, 'sum'], +price)
  }, [form, name, price])

  return <strong>{currencyWithUnit(toRoundFixed(sum), company)}</strong>
}

const Custom = {
  Name,
  Amount,
  Price,
  Sum,
}

export default Custom
