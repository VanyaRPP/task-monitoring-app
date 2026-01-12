import { dateToMonthYear } from '@assets/features/formatDate'
import { usePaymentContext } from '@components/AddPaymentModal'
import { InvoiceComponentProps } from '@components/Tables/EditInvoiceTable'
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

  const rowKey = useMemo(
    () => `${record?.type ?? 'unknown'}:${name.join('.')}`,
    [record?.type, name]
  )

  const initialRef = useRef<{
    rowKey: string
    price: any
    ready: boolean
  } | null>(null)

  useEffect(() => {
    initialRef.current = null
  }, [rowKey])

  const canSnapshot = price !== undefined

  if (!initialRef.current) {
    initialRef.current = { rowKey, price, ready: canSnapshot }
  } else if (!initialRef.current.ready && canSnapshot) {
    initialRef.current = { rowKey, price, ready: true }
  }

  const initial = initialRef.current
  const isChanged =
    initial.ready && toRoundFixed(price) !== toRoundFixed(initial.price)

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

      {editable && isChanged && (
        <Tooltip title="Відновити значення">
          <Button
            icon={<ReloadOutlined />}
            disabled={disabled}
            onClick={() => {
              form.setFieldValue(['invoice', ...name, 'price'], initial.price)
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
}) => {
  const { service, company } = usePaymentContext()

  if (service?.waterPriceTotal && company?.waterPart) {
    return (
      <span>
        {toRoundFixed(company.waterPart)}% від{' '}
        {toRoundFixed(service.waterPriceTotal)} грн
      </span>
    )
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

const WaterPart = { Name, Amount, Price, Sum }
export default WaterPart
