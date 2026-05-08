import { dateToMonthYear } from '@assets/features/formatDate'
import { usePaymentContext } from '@components/AddPaymentModal'
import { InvoiceComponentProps } from '@components/Tables/EditInvoiceTable'
import { DividedSpace } from '@components/UI/DividedSpace'
import { currencyWithUnit, toArray, toFirstUpperCase, toRoundFixed } from '@utils/helpers'
import validator from '@utils/validator'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { Form, Input, Space, Typography, Tooltip } from 'antd'
import { useEffect, useMemo } from 'react'
import { ServiceType } from '@utils/constants'
import UpdateInvoiceButton from '../UpdateInvoiceButton'

export const Name: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
  editable,
  disabled,
}) => {
  const { service, payment, company } = usePaymentContext()
  const name = useMemo(() => toArray<string>(_name), [_name])
  const losses = Form.useWatch(['invoice', ...name, 'losses'], form) ?? 0

  return (
    <Space
      direction="horizontal"
      style={{ justifyContent: 'space-between', width: '100%' }}
    >
      <Space direction="vertical" size={0}>
        <Typography.Text>Електропостачання</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: '0.75rem' }}>
          {toFirstUpperCase(dateToMonthYear(service?.date))}{' '}
          {losses > 0 ? `+ Втрати ${losses}%` : ''}
        </Typography.Text>
      </Space>
      {editable && (
        <UpdateInvoiceButton
          form={form!}
          name={name}
          serviceType={ServiceType.Electricity}
          disabled={disabled}
        />
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
  const losses = Form.useWatch(['invoice', ...name, 'losses'], form) ?? 0

  const lastAmount = Form.useWatch(['invoice', ...name, 'lastAmount'], form)
  const amount = Form.useWatch(['invoice', ...name, 'amount'], form)

  if (!editable) {
    const base = amount - lastAmount
    const withLosses = base + base * (losses / 100)

    return losses > 0 ? (
      <DividedSpace>
        <Typography.Text>{withLosses} кВт</Typography.Text>
        <Tooltip
          title={
            <div>
              <div>
                {toRoundFixed(lastAmount)} → {toRoundFixed(amount)}
              </div>
              <div>
                <strong>Втрати:</strong> {(losses).toFixed(2)}%
              </div>
              <div>
                <strong>З втратами:</strong> {withLosses} кВт
              </div>
            </div>
          }
        >
          <ExclamationCircleOutlined
            style={{ color: '#faad14', marginLeft: 8, cursor: 'pointer' }}
          />
        </Tooltip>
      </DividedSpace>
    ) : (
      <DividedSpace>
        <span>{toRoundFixed(lastAmount)} кВт</span>
        <span>{toRoundFixed(amount)} кВт</span>
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
          suffix="кВт"
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
          suffix="кВт"
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
  const {  company } = usePaymentContext()

  if (!editable) {
    return <span>{currencyWithUnit(toRoundFixed(price), company, 'кВт')}</span>
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
        suffix={currencyWithUnit('', company, 'кВт')}
      />
    </Form.Item>
  )
}

export const Sum: React.FC<InvoiceComponentProps> = ({ form, name: _name }) => {
  const name = useMemo(() => toArray<string>(_name), [_name])
  const { service, payment, company } = usePaymentContext()
  const losses = Form.useWatch(['invoice', ...name, 'losses'], form)

  const lastAmount = Form.useWatch(['invoice', ...name, 'lastAmount'], form)
  const amount = Form.useWatch(['invoice', ...name, 'amount'], form)
  const price = Form.useWatch(['invoice', ...name, 'price'], form)
  const sum = Form.useWatch(['invoice', ...name, 'sum'], form)

  const costAmount = Math.max(+amount - +lastAmount, 0)
  const loss = costAmount + costAmount * (losses / 100)

  useEffect(() => {
    form.setFieldValue(
      ['invoice', ...name, 'sum'],
      losses > 0 ? loss * +price : costAmount * +price
    )
  }, [form, name, amount, lastAmount, price, losses])

  return <strong>{currencyWithUnit(toRoundFixed(sum), company)} </strong>
}

const Electricity = {
  Name,
  Amount,
  Price,
  Sum,
}

export default Electricity
