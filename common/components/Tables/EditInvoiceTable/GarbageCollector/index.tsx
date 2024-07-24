import { dateToMonthYear } from '@common/assets/features/formatDate'
import validator from '@common/assets/features/validators'
import { usePaymentFormData } from '@common/components/Forms/AddPaymentForm'
import { InvoiceComponentProps } from '@common/components/Tables/EditInvoiceTable'
import { toArray, toFirstUpperCase, toRoundFixed } from '@utils/helpers'
import { Form, Input, Space, Typography } from 'antd'
import { useEffect, useMemo } from 'react'

export const Name: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
  editable,
  disabled,
}) => {
  const { service } = usePaymentFormData(form)

  return (
    <Space direction="vertical" size={0}>
      <Typography.Text>Електропостачання</Typography.Text>
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
  const { service, company } = usePaymentFormData(form)

  if (service?.garbageCollectorPrice && company?.rentPart) {
    return (
      <span>
        {toRoundFixed(company.rentPart)}% від{' '}
        {toRoundFixed(service.garbageCollectorPrice)} грн
      </span>
    )
  }
}

export const Price: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
  editable,
  disabled,
}) => {
  const name = useMemo(() => toArray<string>(_name), [_name])

  const price = Form.useWatch(['invoice', ...name, 'price'], form)

  if (!editable) {
    return <span>{toRoundFixed(price)} грн</span>
  }

  return (
    <Form.Item name={[...name, 'price']} rules={[validator.required()]} noStyle>
      <Input
        type="number"
        placeholder="Значення..."
        disabled={disabled}
        suffix="грн"
      />
    </Form.Item>
  )
}

export const Sum: React.FC<InvoiceComponentProps> = ({ form, name: _name }) => {
  const name = useMemo(() => toArray<string>(_name), [_name])

  const price = Form.useWatch(['invoice', ...name, 'price'], form)
  const sum = Form.useWatch(['invoice', ...name, 'sum'], form)

  useEffect(() => {
    form.setFieldValue(['invoice', ...name, 'sum'], +price)
  }, [form, name, price])

  return <strong>{toRoundFixed(sum)} грн</strong>
}

const GarbageCollector = {
  Name,
  Amount,
  Price,
  Sum,
}

export default GarbageCollector
