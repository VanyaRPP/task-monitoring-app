import { dateToMonthYear } from '@assets/features/formatDate'
import { usePaymentContext } from '@components/AddPaymentModal'
import { InvoiceComponentProps } from '@components/Tables/EditInvoiceTable'
import { toArray, toFirstUpperCase, toRoundFixed } from '@utils/helpers'
import validator from '@utils/validator'
import { Form, Input, Space, Typography, Tooltip, Flex } from 'antd'
import { useEffect, useMemo } from 'react'
import UpdateInvoiceButton from '@components/UI/Buttons/UpdateInvoiceButton/UpdateInvoiceButton'
import { ServiceType } from '@utils/constants'

export const Name: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
  editable,
  disabled,
}) => {
  const { service } = usePaymentContext()

  const name = useMemo(() => toArray<string>(_name), [_name])
  const invoices = Form.useWatch(['invoice'], form) || []
  const currentPrice = Form.useWatch(['invoice', ...name, 'price'], form)

  const discountInvoice = useMemo(
    () =>
      invoices.find(
        (invoice: any) => invoice.type === ServiceType.Inflicion
      ),
    [invoices]
  )

  return (
    <Flex justify="space-between" align="center">
      <Space direction="vertical" size={0} style={{ flex: 1, minWidth: 0 }}>
        <Typography.Text>Знижка</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: '0.75rem' }}>
          {toFirstUpperCase(dateToMonthYear(service?.date))}
        </Typography.Text>
      </Space>
        {editable && discountInvoice !== currentPrice && (
          <Tooltip title="Відновити значення">
            <UpdateInvoiceButton
              onClick={() => {
                form.setFieldValue(
                  ['invoice', ...name, 'price'],
                  discountInvoice
                )
              }}
            />
          </Tooltip>
        )}
    </Flex>
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

  const price = Form.useWatch(['invoice', ...name, 'price'], form)

  if (!editable) {
    return <span>{toRoundFixed(price)} грн</span>
  }

  return (
    <Form.Item
      name={[...name, 'price']}
      rules={[validator.required(), validator.max(0)]}
      style={{ margin: 0 }}
    >
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

const Discount = {
  Name,
  Amount,
  Price,
  Sum,
}

export default Discount
