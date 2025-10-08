import { dateToMonthYear } from '@assets/features/formatDate'
import { usePaymentContext } from '@components/AddPaymentModal'
import { InvoiceComponentProps } from '@components/Tables/EditInvoiceTable'
import { DividedSpace } from '@components/UI/DividedSpace'
import { toArray, toFirstUpperCase, toRoundFixed } from '@utils/helpers'
import validator from '@utils/validator'
import { Form, Input, Space, Typography, Tooltip, Button } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { ReloadOutlined } from '@ant-design/icons'

export const Name: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
  editable,
}) => {
  const { service, prevPayment, payment } = usePaymentContext()
  const name = useMemo(() => toArray<string>(_name), [_name])
  const price = Form.useWatch(['invoice', ...name, 'price'], form)
  const lastAmount = Form.useWatch(['invoice', ...name, 'lastAmount'], form)
  const waterAmount =
    payment?.invoice?.find((invoice) => invoice.type === 'waterPrice')
      ?.lastAmount ??
    prevPayment?.invoice?.find((invoice) => invoice.type === 'waterPrice')
      ?.lastAmount
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
      {editable &&
        (service?.waterPrice !== +price || lastAmount !== waterAmount) && (
          <Tooltip title="Відновити значення">
            <Button
              onClick={() => {
                form.setFieldValue(
                  ['invoice', ...name, 'price'],
                  service?.waterPrice
                )
                form.setFieldValue(
                  ['invoice', ...name, 'lastAmount'],
                  waterAmount ?? lastAmount
                )
              }}
              icon={<ReloadOutlined />}
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
