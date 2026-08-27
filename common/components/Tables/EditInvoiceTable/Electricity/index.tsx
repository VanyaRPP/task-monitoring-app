import { dateToMonthYear } from '@assets/features/formatDate'
import { usePaymentContext } from '@components/AddPaymentModal'
import { useInvoiceCurrency } from '@modules/hooks/useInvoiceCurrency'
import { InvoiceComponentProps } from '@components/Tables/EditInvoiceTable'
import { DividedSpace } from '@components/UI/DividedSpace'
import {
  currencyWithUnit,
  toArray,
  toFirstUpperCase,
  toRoundFixed,
} from '@utils/helpers'
import validator from '@utils/validator'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { Form, Input, Space, Typography, Tooltip } from 'antd'
import { useMemo } from 'react'
import { ServiceType } from '@utils/constants'
import InvoiceRowName from '../InvoiceRowName'
import useSyncSum from '../useSyncSum'

export const Name: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
  editable,
  disabled,
  record,
}) => {
  const { service } = usePaymentContext()
  const name = useMemo(() => toArray<string>(_name), [_name])
  const losses = Form.useWatch(['invoice', ...name, 'losses'], form) ?? 0

  return (
    <InvoiceRowName
      form={form}
      name={name}
      record={record}
      serviceType={ServiceType.Electricity}
      editable={editable}
      disabled={disabled}
      label="Електропостачання"
      subtitle={
        <>
          {toFirstUpperCase(dateToMonthYear(service?.date))}{' '}
          {losses > 0 ? `+ Втрати ${losses}%` : ''}
        </>
      }
    />
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
    const withLosses = Number(toRoundFixed(base + base * (losses / 100)))

    return losses > 0 ? (
      <DividedSpace>
        <Typography.Text>{toRoundFixed(withLosses)} кВт</Typography.Text>
        <Tooltip
          title={
            <div>
              <div>
                {toRoundFixed(lastAmount)} → {toRoundFixed(amount)}
              </div>
              <div>
                <strong>Втрати:</strong> {losses.toFixed(2)}%
              </div>
              <div>
                <strong>З втратами:</strong> {toRoundFixed(withLosses)} кВт
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
          style={{ width: 140 }}
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
          style={{ width: 140 }}
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
  const currency = useInvoiceCurrency()

  if (!editable) {
    return <span>{currencyWithUnit(toRoundFixed(price), currency, 'кВт')}</span>
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
        suffix={currencyWithUnit('', currency, 'кВт')}
      />
    </Form.Item>
  )
}

export const Sum: React.FC<InvoiceComponentProps> = ({ form, name: _name }) => {
  const name = useMemo(() => toArray<string>(_name), [_name])
  const { service, payment } = usePaymentContext()
  const currency = useInvoiceCurrency()
  const losses = Form.useWatch(['invoice', ...name, 'losses'], form)

  const lastAmount = Form.useWatch(['invoice', ...name, 'lastAmount'], form)
  const amount = Form.useWatch(['invoice', ...name, 'amount'], form)
  const price = Form.useWatch(['invoice', ...name, 'price'], form)
  const sum = Form.useWatch(['invoice', ...name, 'sum'], form)

  const costAmount = Math.max(+amount - +lastAmount, 0)
  const loss = costAmount + costAmount * (losses / 100)

  useSyncSum(form!, name, losses > 0 ? loss * +price : costAmount * +price)

  return <strong>{currencyWithUnit(toRoundFixed(sum), currency)} </strong>
}

const Electricity = {
  Name,
  Amount,
  Price,
  Sum,
}

export default Electricity
