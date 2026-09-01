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
import { Button, Form, Input, Space, Tooltip, Typography } from 'antd'
import { CheckOutlined, PlusOutlined } from '@ant-design/icons'
import React, { useMemo } from 'react'
import useSyncSum from '../useSyncSum'
import { LabelInput } from '../LabelInput'
import { UpdateInvoiceButton } from './UpdateInvoiceButton'

const SaveIconToggle: React.FC<{
  checked?: boolean
  onChange?: (val: boolean) => void
  disabled?: boolean
}> = ({ checked, onChange, disabled }) => (
  <Tooltip title={checked ? 'Збережено в каталог' : 'Додати в каталог домену'}>
    <Button
      size="small"
      type={checked ? 'primary' : 'text'}
      icon={checked ? <CheckOutlined /> : <PlusOutlined />}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      style={{
        color: checked ? undefined : '#8c8c8c',
        boxShadow: 'none',
      }}
    />
  </Tooltip>
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
  const defaultLabel = value && value !== 'custom' ? value : ''

  const adHocBinding = 'name'

  const defaultPrice = useMemo(
    () =>
      resolveCustomServicePrice(fieldName, { company, service, prevPayment }),
    [company, service, prevPayment, fieldName]
  )

  const hasName = Boolean(value && typeof value === 'string' && value.trim())

  if (!editable || type !== 'custom') {
    const displayName =
      record?.name && record.name !== 'custom'
        ? record.name
        : record?.customName && record.customName !== 'custom'
          ? record.customName
          : ''
    return (
      <Space direction="vertical" size={0}>
        <Typography.Text>{displayName}</Typography.Text>
        {record?.description && (
          <Typography.Text type="secondary" style={{ fontSize: '0.75rem' }}>
            {record.description}
          </Typography.Text>
        )}
      </Space>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        gap: 8,
        paddingTop: 2,
        paddingBottom: 2,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Form.Item
          name={isCustomService ? [...name, 'name'] : [...name, adHocBinding]}
          rules={!isCustomService ? [validator.required()] : undefined}
          style={{ margin: 0 }}
        >
          {isCustomService ? (
            <LabelInput defaultLabel={defaultLabel} disabled={disabled} />
          ) : (
            <Input placeholder="Назва..." disabled={disabled} />
          )}
        </Form.Item>

        <Form.Item
          name={[...name, 'description']}
          style={{ margin: 0, marginTop: 4 }}
        >
          <Input
            size="small"
            variant="borderless"
            placeholder="Опис"
            disabled={disabled}
            style={{
              padding: 0,
              fontSize: '0.75rem',
              lineHeight: 1.2,
              height: 'auto',
              minHeight: 'unset',
              boxShadow: 'none',
            }}
          />
        </Form.Item>
      </div>

      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {!isCustomService && hasName && (
          <Form.Item
            name={[...name, 'saveToDomain']}
            valuePropName="checked"
            style={{ margin: 0 }}
          >
            <SaveIconToggle disabled={disabled} />
          </Form.Item>
        )}
        <UpdateInvoiceButton
          currentPrice={currentPrice}
          defaultPrice={defaultPrice}
          editable={editable}
          type={type}
          onRestore={() =>
            form?.setFieldValue(['invoice', ...name, 'price'], defaultPrice)
          }
        />
      </div>
    </div>
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

  return (
    <strong style={{ display: 'block' }}>
      {currencyWithUnit(toRoundFixed(sum), currency)}
    </strong>
  )
}

const Custom = {
  Name,
  Amount,
  Price,
  Sum,
}

export default Custom
