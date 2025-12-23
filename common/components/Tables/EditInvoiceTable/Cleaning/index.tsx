import { dateToMonthYear } from '@assets/features/formatDate'
import { usePaymentContext } from '@components/AddPaymentModal'
import { InvoiceComponentProps } from '@components/Tables/EditInvoiceTable'
import { toArray, toFirstUpperCase, toRoundFixed } from '@utils/helpers'
import validator from '@utils/validator'
import { ServiceType } from '@utils/constants'
import { Form, Input, Space, Tooltip, Typography, Flex } from 'antd'
import { useEffect, useMemo, useRef } from 'react'
import UpdateInvoiceButton from '@components/UI/Buttons/UpdateInvoiceButton/UpdateInvoiceButton'

const useCleaningReset = (form: any, name: (string | number)[]) => {
  const price = Form.useWatch(['invoice', ...name, 'price'], form)

  const initialPrice = useMemo(() => {
    return form.getFieldValue(['invoice', ...name, 'price'])
  }, [])

  const isInitial = useMemo(() => {
    return toRoundFixed(price) === toRoundFixed(initialPrice)
  }, [price, initialPrice])

  const reset = () => {
    form.setFieldValue(['invoice', ...name, 'price'], initialPrice)
  }

  return {
    isInitial,
    initialPrice,
    reset,
  }
}



export const Name: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
  editable,
}) => {
  const name = useMemo(() => toArray<string>(_name), [_name])
  const { service } = usePaymentContext()

  const { isInitial, reset } = useCleaningReset(form, name)

  return (
    <Flex justify="space-between" align="center">
      <Space direction="vertical" size={0} style={{ flex: 1, minWidth: 0 }}>
        <Typography.Text>Прибирання</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: '0.75rem' }}>
          {toFirstUpperCase(dateToMonthYear(service?.date))}
        </Typography.Text>
      </Space>
      {editable && !isInitial && (
        <Tooltip title="Відновити значення">
          <UpdateInvoiceButton onClick={reset} />
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
      rules={[validator.required(), validator.min(0)]}
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

const Cleaning = {
  Name,
  Amount,
  Price,
  Sum,
}

export default Cleaning
