import { dateToMonthYear } from '@assets/features/formatDate'
import { usePaymentContext } from '@components/AddPaymentModal'
import { InvoiceComponentProps } from '@components/Tables/EditInvoiceTable'
import { resolveCustomServicePrice } from '@utils/domain/domain-invoice-selector'
import {
  currencyWithUnit,
  toArray,
  toFirstUpperCase,
  toRoundFixed,
} from '@utils/helpers'
import validator from '@utils/validator'
import { Form, Input, InputProps, Space, Typography } from 'antd'
import { useEffect, useMemo } from 'react'
import useSyncSum from '../useSyncSum'
import { UpdateInvoiceButton } from './UpdateInvoiceButton'

const LabelInput: React.FC<InputProps & { defaultLabel?: string }> = ({
  defaultLabel,
  value,
  onChange,
  disabled,
}) => (
  <Input
    value={value !== undefined && value !== null ? value : defaultLabel}
    onChange={onChange}
    disabled={disabled}
  />
)

export const Name: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
  editable,
  disabled,
  record,
}) => {
  const name = useMemo(() => toArray<string>(_name), [_name])

  const value = Form.useWatch(['invoice', ...name, 'name'], form)
  const type = Form.useWatch(['invoice', ...name, 'type'], form)
  const fieldName = Form.useWatch(['invoice', ...name, 'fieldName'], form)
  const isCustomService = Form.useWatch(
    ['invoice', ...name, 'customService'],
    form
  )

  const { service, company, prevPayment } = usePaymentContext()
  const currentPrice = Form.useWatch(['invoice', ...name, 'price'], form)
  const defaultLabel = value || type || ''

  useEffect(() => {
    if (!editable || !form || !name.length) return
    const current = form.getFieldValue(['invoice', ...name, 'description'])
    if (current === undefined || current === null || current === '') {
      form.setFieldValue(['invoice', ...name, 'description'], defaultLabel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const defaultPrice = useMemo(
    () =>
      resolveCustomServicePrice(fieldName, { company, service, prevPayment }),
    [company, service, prevPayment, fieldName]
  )

  if (!editable || type !== 'custom') {
    return (
      <Space direction="vertical" size={0}>
        <Typography.Text>{record?.description || value || type}</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: '0.75rem' }}>
          {toFirstUpperCase(dateToMonthYear(service?.date))}
        </Typography.Text>
      </Space>
    )
  }

  return (
    <Space
      direction="horizontal"
      style={{ justifyContent: 'space-between', width: '100%' }}
    >
      <Space direction="vertical" size={0}>
        {isCustomService ? (
          <Form.Item name={[...name, 'description']} style={{ margin: 0 }}>
            <LabelInput defaultLabel={defaultLabel} disabled={disabled} />
          </Form.Item>
        ) : (
          <Form.Item
            name={[...name, 'name']}
            rules={[validator.required()]}
            style={{ margin: 0 }}
          >
            <Input placeholder="Назва..." disabled={disabled} />
          </Form.Item>
        )}
        <Typography.Text type="secondary" style={{ fontSize: '0.75rem' }}>
          {toFirstUpperCase(dateToMonthYear(service?.date))}
        </Typography.Text>
      </Space>
      <UpdateInvoiceButton
        currentPrice={currentPrice}
        defaultPrice={defaultPrice}
        editable={editable}
        type={type}
        onRestore={() =>
          form.setFieldValue(['invoice', ...name, 'price'], defaultPrice)
        }
      />
    </Space>
  )
}

export const Amount: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
  editable,
  disabled,
  record,
}) => {
  const name = useMemo(() => toArray<string>(_name), [_name])
  const amount = Form.useWatch(['invoice', ...name, 'amount'], form)
  const initialAmount = record?.amount ?? 1
  const currentAmount = amount ?? initialAmount

  if (!editable) {
    return <span>{toRoundFixed(currentAmount)}</span>
  }

  return (
    <Form.Item
      name={[...name, 'amount']}
      initialValue={initialAmount}
      rules={[validator.required(), validator.min(1)]}
      style={{ margin: 0 }}
    >
      <Input type="number" placeholder="К-сть..." disabled={disabled} />
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
  const amount = Form.useWatch(['invoice', ...name, 'amount'], form)
  const sum = Form.useWatch(['invoice', ...name, 'sum'], form)
  const { company } = usePaymentContext()

  useSyncSum(form!, name, +price * (+amount > 0 ? +amount : 1))

  return <strong>{currencyWithUnit(toRoundFixed(sum), company)}</strong>
}

const Custom = {
  Name,
  Amount,
  Price,
  Sum,
}

export default Custom
