import { dateToMonthYear } from '@assets/features/formatDate'
import { usePaymentContext } from '@components/AddPaymentModal'
import { InvoiceComponentProps } from '@components/Tables/EditInvoiceTable'
import { currencyWithUnit, toArray, toFirstUpperCase, toRoundFixed } from '@utils/helpers'
import validator from '@utils/validator'
import { Form, Input, Space, Typography, Tooltip, Button } from 'antd'
import { useEffect, useMemo } from 'react'
import { ServiceType } from '@utils/constants'
import UpdateInvoiceButton from '../UpdateInvoiceButton'
import { ReloadOutlined } from '@ant-design/icons'

export const Name: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
  editable,
  disabled,
}) => {
  const { service } = usePaymentContext()
  const name = useMemo(() => toArray<string>(_name), [_name])

  return (
    <Space
      direction="horizontal"
      style={{ justifyContent: 'space-between', width: '100%' }}
    >
      <Space direction="vertical" size={0}>
        <Typography.Text>Частка водопостачання</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: '0.75rem' }}>
          {toFirstUpperCase(dateToMonthYear(service?.date))}
        </Typography.Text>
      </Space>
      {editable && (
        <UpdateInvoiceButton
          form={form!}
          name={name}
          serviceType={ServiceType.WaterPart}
          disabled={disabled}
        />
      )}
    </Space>
  )
}

export const Amount: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
  editable,
  disabled,
}) => {
  const { service, company } = usePaymentContext()
  const name = useMemo(() => toArray<string>(_name), [_name])
  const waterPartPrice = +(
    (service?.waterPriceTotal * company?.waterPart) /
    100
  )
  const price = Form.useWatch(['invoice', ...name, 'price'], form)

  if (service?.garbageCollectorPrice && company?.rentPart) {
    return (
      <Space
        direction="horizontal"
        style={{ justifyContent: 'space-between', width: '100%' }}
      >
        <span>
          {toRoundFixed(company.waterPart)}% від{' '}
          {currencyWithUnit(toRoundFixed(service.waterPriceTotal), company)} = {' '}
        </span>
      </Space>
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
  const { company } = usePaymentContext()

  if (!editable) {
    return <span>{currencyWithUnit(toRoundFixed(price), company)}</span>
  }

  return (
    <Form.Item name={[...name, 'price']} rules={[validator.required()]} noStyle>
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
    form.setFieldValue(['invoice', ...name, 'sum'], +price || 0)
  }, [form, name, price])

  return <strong>{currencyWithUnit(toRoundFixed(sum), company)}</strong>
}

const WaterPart = {
  Name,
  Amount,
  Price,
  Sum,
}

export default WaterPart
