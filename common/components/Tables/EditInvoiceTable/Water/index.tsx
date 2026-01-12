import { dateToMonthYear } from '@assets/features/formatDate'
import { usePaymentContext } from '@components/AddPaymentModal'
import { InvoiceComponentProps } from '@components/Tables/EditInvoiceTable'
import { DividedSpace } from '@components/UI/DividedSpace'
import { toArray, toFirstUpperCase, toRoundFixed } from '@utils/helpers'
import validator from '@utils/validator'
import { Form, Input, Space, Typography, Tooltip, Button, message } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { useEffect, useMemo, useRef } from 'react'

export const Name: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
  editable,
  disabled,
  record,
}) => {
  const { service } = usePaymentContext()
  const name = useMemo(() => toArray<string>(_name), [_name])

  const price = Form.useWatch(['invoice', ...name, 'price'], form)
  const lastAmount = Form.useWatch(['invoice', ...name, 'lastAmount'], form)
  const amount = Form.useWatch(['invoice', ...name, 'amount'], form)
  const rowKey = useMemo(
    () => `${record?.type ?? 'unknown'}:${name.join('.')}`,
    [record?.type, name]
  )

  const initialRef = useRef<{
    rowKey: string
    price: any
    lastAmount: any
    amount: any
    ready: boolean
  } | null>(null)

  useEffect(() => {
    initialRef.current = null
  }, [rowKey])

  const canSnapshot =
    price !== undefined && lastAmount !== undefined && amount !== undefined

  if (!initialRef.current) {
    initialRef.current = {
      rowKey,
      price,
      lastAmount,
      amount,
      ready: canSnapshot,
    }
  } else if (!initialRef.current.ready && canSnapshot) {
    initialRef.current = {
      rowKey,
      price,
      lastAmount,
      amount,
      ready: true,
    }
  }

  const initial = initialRef.current

  const isChanged =
    initial.ready &&
    (toRoundFixed(price) !== toRoundFixed(initial.price) ||
      toRoundFixed(lastAmount) !== toRoundFixed(initial.lastAmount) ||
      toRoundFixed(amount) !== toRoundFixed(initial.amount))

  return (
    <Space
      direction="horizontal"
      style={{ justifyContent: 'space-between', width: '100%' }}
    >
      <Space direction="vertical" size={0}>
        <Typography.Text>Водопостачання</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: '0.75rem' }}>
          {toFirstUpperCase(dateToMonthYear(service?.date))}
        </Typography.Text>
      </Space>

      {editable && isChanged && (
        <Tooltip title="Відновити значення">
          <Button
            icon={<ReloadOutlined />}
            disabled={disabled}
            onClick={() => {
              form.setFieldValue(['invoice', ...name, 'price'], initial.price)
              form.setFieldValue(
                ['invoice', ...name, 'lastAmount'],
                initial.lastAmount
              )
              form.setFieldValue(['invoice', ...name, 'amount'], initial.amount)
              form.setFieldValue(['invoiceMeta', 'changed'], false)
              message.success('Початкове значення відновлено')
            }}
          />
        </Tooltip>
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
  const name = useMemo(() => toArray<string>(_name), [_name])

  const lastAmount = Form.useWatch(['invoice', ...name, 'lastAmount'], form)
  const amount = Form.useWatch(['invoice', ...name, 'amount'], form)

  if (!editable) {
    return (
      <DividedSpace>
        <span>
          {toRoundFixed(lastAmount)} м<sup>3</sup>
        </span>
        <span>
          {toRoundFixed(amount)} м<sup>3</sup>
        </span>
      </DividedSpace>
    )
  }

  return (
    <Space>
      <Form.Item
        name={[...name, 'lastAmount']}
        rules={[validator.required(), validator.min(0)]}
        noStyle
      >
        <Input
          type="number"
          placeholder="Значення..."
          disabled={disabled}
          suffix={
            <span>
              м<sup>3</sup>
            </span>
          }
        />
      </Form.Item>
      <Form.Item
        name={[...name, 'amount']}
        rules={[validator.required(), validator.min(0)]}
        noStyle
      >
        <Input
          type="number"
          placeholder="Значення..."
          disabled={disabled}
          suffix={
            <span>
              м<sup>3</sup>
            </span>
          }
        />
      </Form.Item>
    </Space>
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

  if (!editable) {
    return <span>{toRoundFixed(price)} грн</span>
  }

  return (
    <Form.Item name={[...name, 'price']} rules={[validator.required()]} noStyle>
      <Input
        type="number"
        placeholder="Значення..."
        disabled={disabled}
        suffix={
          <>
            грн/м<sup>3</sup>
          </>
        }
      />
    </Form.Item>
  )
}

export const Sum: React.FC<InvoiceComponentProps> = ({ form, name: _name }) => {
  const name = useMemo(() => toArray<string>(_name), [_name])

  const lastAmount = Form.useWatch(['invoice', ...name, 'lastAmount'], form)
  const amount = Form.useWatch(['invoice', ...name, 'amount'], form)
  const price = Form.useWatch(['invoice', ...name, 'price'], form)
  const sum = Form.useWatch(['invoice', ...name, 'sum'], form)

  useEffect(() => {
    form.setFieldValue(
      ['invoice', ...name, 'sum'],
      Math.max(+amount - +lastAmount, 0) * +price
    )
  }, [form, name, amount, lastAmount, price])

  return <strong>{toRoundFixed(sum)} грн</strong>
}

const Water = {
  Name,
  Amount,
  Price,
  Sum,
}

export default Water
