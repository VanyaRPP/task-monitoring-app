import { dateToMonthYear } from '@assets/features/formatDate'
import { usePaymentContext } from '@components/AddPaymentModal'
import { InvoiceComponentProps } from '@components/Tables/EditInvoiceTable'
import { ServiceType } from '@utils/constants'
import { toArray, toFirstUpperCase, toRoundFixed } from '@utils/helpers'
import validator from '@utils/validator'
import { Flex, Form, Input, Space, Tooltip, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import UpdateInvoiceButton from '@components/UI/Buttons/UpdateInvoiceButton/UpdateInvoiceButton'

const useInflicionCalculation = (form: any, name: string[]) => {
  const { company, prevService, prevPayment } = usePaymentContext()

  const price = Form.useWatch(['invoice', ...name, 'price'], form)

  const prevPlacingInvoice = useMemo(() => {
    return prevPayment?.invoice.find(
      (i) => i.type === ServiceType.Placing
    )
  }, [prevPayment])

  const rentSum = useMemo(() => {
    if (typeof prevPlacingInvoice?.sum === 'number') {
      return prevPlacingInvoice.sum
    }

    const area = company?.totalArea ?? 0
    const pricePerMeter =
      company?.pricePerMeter ??
      prevService?.rentPrice ??
      0

    return area * pricePerMeter
  }, [prevPlacingInvoice, company, prevService])

  const calculatedInflicionPrice = useMemo(() => {
    if (!company?.inflicion || !prevService?.inflicionPrice) return null

    const inflicionPercent = Math.max(
      prevService.inflicionPrice - 100,
      0
    )

    return +toRoundFixed((rentSum / 100) * inflicionPercent)
  }, [company, prevService, rentSum])

  const isInitial = useMemo(() => {
    if (calculatedInflicionPrice === null) return true
    return (
      toRoundFixed(price) ===
      toRoundFixed(calculatedInflicionPrice)
    )
  }, [price, calculatedInflicionPrice])

  const reset = () => {
    if (calculatedInflicionPrice === null) return
    form.setFieldValue(
      ['invoice', ...name, 'price'],
      calculatedInflicionPrice
    )
  }

  return {
    enabled: company?.inflicion,
    calculatedInflicionPrice,
    isInitial,
    reset,
  }
}

export const Name: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
  editable,
}) => {
  const name = useMemo(() => toArray<string>(_name), [_name])
  const { prevService } = usePaymentContext()

  const {
    enabled,
    isInitial,
    reset,
  } = useInflicionCalculation(form, name)

  return (
    <Flex justify="space-between" align="center">
      <Space direction="vertical" size={0}>
        <Typography.Text>Інфляція</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: '0.9rem' }}>
          {enabled ? '(донарах. інд. інф.)' : '(незмінна)'}
        </Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: '0.75rem' }}>
          {toFirstUpperCase(dateToMonthYear(prevService?.date))}
        </Typography.Text>
      </Space>

      {editable && enabled && !isInitial && (
        <Tooltip title="Відновити початкове значення">
          <UpdateInvoiceButton onClick={reset} />
        </Tooltip>
      )}
    </Flex>
  )
}


export const Amount: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
}) => {
  const name = useMemo(() => toArray<string>(_name), [_name])

  const {
    enabled,
    calculatedInflicionPrice,
  } = useInflicionCalculation(form, name)

  if (!enabled) return null

  return (
    <Typography.Text>
      {calculatedInflicionPrice !== null
        ? `${toRoundFixed(calculatedInflicionPrice)} грн`
        : 'Інфляція за попередній місяць невідома'}
    </Typography.Text>
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
  return <strong>{toRoundFixed(price)} грн</strong>
}

const Inflicion = {
  Name,
  Amount,
  Price,
  Sum,
}

export default Inflicion
