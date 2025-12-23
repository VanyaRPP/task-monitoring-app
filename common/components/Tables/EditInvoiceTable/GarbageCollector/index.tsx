import { dateToMonthYear } from '@assets/features/formatDate'
import { usePaymentContext } from '@components/AddPaymentModal'
import { InvoiceComponentProps } from '@components/Tables/EditInvoiceTable'
import { toArray, toFirstUpperCase, toRoundFixed } from '@utils/helpers'
import validator from '@utils/validator'
import { Form, Input, Space, Typography, Tooltip, Flex } from 'antd'
import { useEffect, useMemo } from 'react'
import UpdateInvoiceButton from '@components/UI/Buttons/UpdateInvoiceButton/UpdateInvoiceButton'

const calculateGarbagePrice = (
  basePrice?: number,
  rentPart?: number
) => {
  if (!basePrice || !rentPart) return 0
  return +(basePrice * (rentPart / 100))
}

export const Name: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
  editable,
}) => {
  const { service, company } = usePaymentContext()
  const name = useMemo(() => toArray<string>(_name), [_name])

  const calculatedPrice = calculateGarbagePrice(
    service?.garbageCollectorPrice,
    company?.rentPart
  )

  const currentPrice = Form.useWatch(['invoice', ...name, 'price'], form)

  const isInitial =
    toRoundFixed(currentPrice) === toRoundFixed(calculatedPrice)

  return (
    <Flex justify="space-between" align="center">
      <Space direction="vertical" size={0}>
        <Typography.Text>Вивіз ТПВ</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: '0.75rem' }}>
          {toFirstUpperCase(dateToMonthYear(service?.date))}
        </Typography.Text>
      </Space>

      {editable && !isInitial && (
        <Tooltip title="Відновити значення">
          <UpdateInvoiceButton
            onClick={() => {
              form.setFieldValue(
                ['invoice', ...name, 'price'],
                calculatedPrice
              )
            }}
          />
        </Tooltip>
      )}
    </Flex>
  )
}

export const Amount: React.FC<InvoiceComponentProps> = () => {
  const { service, company } = usePaymentContext()

  if (!service?.garbageCollectorPrice || !company?.rentPart) {
    return null
  }

  return (
    <span>
      {toRoundFixed(company.rentPart)}% від{' '}
      {toRoundFixed(service.garbageCollectorPrice)} грн
    </span>
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
