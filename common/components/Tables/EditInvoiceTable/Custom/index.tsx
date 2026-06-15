import { dateToMonthYear } from '@assets/features/formatDate'
import { usePaymentContext } from '@components/AddPaymentModal'
import { useInvoiceCurrency } from '@modules/hooks/useInvoiceCurrency'
import { InvoiceComponentProps } from '@components/Tables/EditInvoiceTable'
import { resolveCustomServicePrice } from '@utils/domain/domain-invoice-selector'
import {
  currencyWithUnit,
  toArray,
  toFirstUpperCase,
  toRoundFixed,
} from '@utils/helpers'
import validator from '@utils/validator'
import { Form, Input, Space, Typography } from 'antd'
import { useEffect, useMemo } from 'react'
import useSyncSum from '../useSyncSum'
import { LabelInput } from '../LabelInput'
import { UpdateInvoiceButton } from './UpdateInvoiceButton'

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
  const monthLabel = toFirstUpperCase(dateToMonthYear(service?.date))

  // Seed `customName` once defaultLabel is known. defaultLabel is derived
  // from useWatch-backed `value`/`type`, which are undefined on first render
  // and become available a tick later — so we run on every defaultLabel
  // change and only write when the field is still blank.
  useEffect(() => {
    if (!editable || !form || !name.length || !defaultLabel) return
    const current = form.getFieldValue(['invoice', ...name, 'customName'])
    if (!current) {
      form.setFieldValue(['invoice', ...name, 'customName'], defaultLabel)
    }
  }, [defaultLabel, editable, form, name])

  const defaultPrice = useMemo(
    () =>
      resolveCustomServicePrice(fieldName, { company, service, prevPayment }),
    [company, service, prevPayment, fieldName]
  )

  if (!editable || type !== 'custom') {
    return (
      <Space direction="vertical" size={0}>
        <Typography.Text>
          {record?.customName || value || type}
        </Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: '0.75rem' }}>
          {record?.description || monthLabel}
        </Typography.Text>
      </Space>
    )
  }

  return (
    <Space
      direction="horizontal"
      style={{ justifyContent: 'space-between', width: '100%' }}
    >
      <Space direction="vertical" size={0} style={{ width: '100%' }}>
        {isCustomService ? (
          <Form.Item name={[...name, 'customName']} style={{ margin: 0 }}>
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
        <Form.Item name={[...name, 'description']} style={{ margin: 0 }}>
          <Input
            size="small"
            variant="borderless"
            placeholder="Опис"
            disabled={disabled}
            style={{ padding: 0, fontSize: '0.75rem' }}
          />
        </Form.Item>
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
  const amount = Form.useWatch(['invoice', ...name, 'amount'], form)
  const sum = Form.useWatch(['invoice', ...name, 'sum'], form)
  const currency = useInvoiceCurrency()

  useSyncSum(form!, name, +price * (+amount > 0 ? +amount : 1))

  return <strong>{currencyWithUnit(toRoundFixed(sum), currency)}</strong>
}

const Custom = {
  Name,
  Amount,
  Price,
  Sum,
}

export default Custom
