import { dateToMonthYear } from '@assets/features/formatDate'
import { usePaymentContext } from '@components/AddPaymentModal'
import { InvoiceComponentProps } from '@components/Tables/EditInvoiceTable'
import { toArray, toFirstUpperCase, toRoundFixed } from '@utils/helpers'
import validator from '@utils/validator'
import { Flex, Form, Input, Space, Tooltip, Typography } from 'antd'
import { useEffect, useMemo } from 'react'
import UpdateInvoiceButton from '@components/UI/Buttons/UpdateInvoiceButton/UpdateInvoiceButton'

const useMaintenanceCalculations = (form: any, name: number[]) => {
  const price = Form.useWatch(['invoice', ...name, 'price'], form)
  const amount = Form.useWatch(['invoice', ...name, 'amount'], form)

  const initialPrice = useMemo(() => {
    return form.getFieldValue(['invoice', ...name, 'price'])
  }, [])

  const initialAmount = useMemo(() => {
    return form.getFieldValue(['invoice', ...name, 'amount'])
  }, [])

  const isInitial = useMemo(() => {
    return (
      toRoundFixed(price) === toRoundFixed(initialPrice) &&
      toRoundFixed(amount) === toRoundFixed(initialAmount)
    )
  }, [price, amount, initialPrice, initialAmount])

  return {
    isInitial,
    initialPrice,
    initialAmount,
  }
}

export const Name: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
  editable,
}) => {
  const { service } = usePaymentContext()
  const name = useMemo(() => toArray<number>(_name), [_name])

  const { isInitial, initialPrice, initialAmount } =
    useMaintenanceCalculations(form, name)

  return (
    <Flex justify="space-between" align="center">
      <Space direction="vertical" size={0}>
        <Typography.Text>Утримання</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: '0.75rem' }}>
          {toFirstUpperCase(dateToMonthYear(service?.date))}
        </Typography.Text>
      </Space>

      {editable && !isInitial && (
        <Tooltip title="Відновити початкове значення">
          <UpdateInvoiceButton
            onClick={() => {
              Promise.resolve().then(() => {
                form.setFieldValue(
                  ['invoice', ...name, 'price'],
                  initialPrice
                )
                form.setFieldValue(
                  ['invoice', ...name, 'amount'],
                  initialAmount
                )
              })
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

  const name = useMemo(() => toArray<number>(_name), [_name])
  const amount = Form.useWatch(['invoice', ...name, 'amount'], form)

  if (!editable) {
    return (
      <span>
        {toRoundFixed(amount)} м<sup>2</sup>
      </span>
    )
  }

  return (
    <Form.Item
      name={[...name, 'amount']}
      rules={[validator.required(), validator.min(0)]}
      style={{ margin: 0 }}
    >
      <Input
        type="number"
        placeholder="Значення..."
        disabled={disabled}
        suffix={
          <span>
            м<sup>2</sup>
          </span>
        }
      />
    </Form.Item>
  )
}

export const Price: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
  editable,
  disabled,
}) => {

  const name = useMemo(() => toArray<number>(_name), [_name])
  const price = Form.useWatch(['invoice', ...name, 'price'], form)

  if (!editable) {
    return (
      <span>
        {toRoundFixed(price)} грн/м<sup>2</sup>
      </span>
    )
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
        suffix={
          <span>
            грн/м<sup>2</sup>
          </span>
        }
      />
    </Form.Item>
  )
}

export const Sum: React.FC<InvoiceComponentProps> = ({ form, name: _name }) => {
  const name = useMemo(() => toArray<string>(_name), [_name])

  const price = Form.useWatch(['invoice', ...name, 'price'], form)
  const amount = Form.useWatch(['invoice', ...name, 'amount'], form)
  const sum = Form.useWatch(['invoice', ...name, 'sum'], form)

  useEffect(() => {
    form.setFieldValue(['invoice', ...name, 'sum'], +price * +amount)
  }, [form, name, price, amount])

  return <strong>{toRoundFixed(sum)} грн</strong>
}

const Maintenance = {
  Name,
  Amount,
  Price,
  Sum,
}

export default Maintenance
