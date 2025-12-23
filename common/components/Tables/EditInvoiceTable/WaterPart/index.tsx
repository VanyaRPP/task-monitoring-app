import { dateToMonthYear } from '@assets/features/formatDate'
import { usePaymentContext } from '@components/AddPaymentModal'
import { InvoiceComponentProps } from '@components/Tables/EditInvoiceTable'
import { toArray, toFirstUpperCase, toRoundFixed } from '@utils/helpers'
import validator from '@utils/validator'
import { Form, Input, Space, Typography, Tooltip, Flex } from 'antd'
import { useEffect, useMemo } from 'react'
import UpdateInvoiceButton from '@components/UI/Buttons/UpdateInvoiceButton/UpdateInvoiceButton'

const useWaterPartCalculation = (form: any, name: string[]) => {
  const { service, company } = usePaymentContext()
  const price = Form.useWatch(['invoice', ...name, 'price'], form)

  const calculatedPrice = useMemo(() => {
    if (
      typeof service?.waterPriceTotal !== 'number' ||
      typeof company?.waterPart !== 'number'
    ) {
      return null
    }

    return (service.waterPriceTotal * company.waterPart) / 100
  }, [service, company])

  const isChanged = useMemo(() => {
    if (calculatedPrice === null || price === undefined) return false
    return (
      toRoundFixed(calculatedPrice) !==
      toRoundFixed(price)
    )
  }, [calculatedPrice, price])

  return {
    calculatedPrice,
    isChanged,
  }
}

export const Name: React.FC<InvoiceComponentProps> = ({ 
  form,
  name: _name,
  editable,
  disabled,
}) => {

  const { service } = usePaymentContext()
  const name = useMemo(() => toArray<string>(_name), [_name])
  const price = Form.useWatch(['invoice', ...name, 'price'], form)


  const { calculatedPrice, isChanged } = useWaterPartCalculation(form, name)

  useEffect(() => {
    if (
      editable &&
      calculatedPrice !== null &&
      price === undefined
    ) {
      form.setFieldValue(
        ['invoice', ...name, 'price'],
        calculatedPrice
      )
    }
  }, [editable, calculatedPrice, price, form, name])

  return (
    <Flex justify="space-between" align="center">
      <Space direction="vertical" size={0}>
        <Typography.Text>Частка водопостачання</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: '0.75rem' }}>
          {toFirstUpperCase(dateToMonthYear(service?.date))}
        </Typography.Text>
      </Space>
      {isChanged && calculatedPrice !== null && (
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

  if (
    typeof service?.waterPriceTotal !== 'number' ||
    typeof company?.waterPart !== 'number'
  ) {
    return <span>—</span>
  }

  return (
    <span>
      {toRoundFixed(company.waterPart)}% від{' '}
      {toRoundFixed(service.waterPriceTotal)} грн
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
      <Form.Item
        name={[...name, 'price']}
        rules={[validator.required(), validator.min(0)]}
        noStyle
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

const WaterPart = {
  Name,
  Amount,
  Price,
  Sum,
}

export default WaterPart
