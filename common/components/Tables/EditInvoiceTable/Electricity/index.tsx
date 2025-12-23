import { dateToMonthYear } from '@assets/features/formatDate'
import { usePaymentContext } from '@components/AddPaymentModal'
import { InvoiceComponentProps } from '@components/Tables/EditInvoiceTable'
import { DividedSpace } from '@components/UI/DividedSpace'
import { toArray, toFirstUpperCase, toRoundFixed } from '@utils/helpers'
import validator from '@utils/validator'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { Form, Input, Space, Typography, Tooltip, Flex } from 'antd'
import { useEffect, useMemo, useRef } from 'react'
import UpdateInvoiceButton from '../../../UI/Buttons/UpdateInvoiceButton/UpdateInvoiceButton'

const useElectricityReset = (
  form: any,
  name: (string | number)[],
  initialPrice?: number
) => {
  const initialRef = useRef<{
    price?: number
    amount?: number
    lastAmount?: number
    losses?: number
  } | null>(null)

  if (!initialRef.current) {
    initialRef.current = {
      price:
        initialPrice ??
        form.getFieldValue(['invoice', ...name, 'price']),
      amount: form.getFieldValue(['invoice', ...name, 'amount']),
      lastAmount: form.getFieldValue(['invoice', ...name, 'lastAmount']),
      losses: form.getFieldValue(['invoice', ...name, 'losses']),
    }
  }

  const price = Form.useWatch(['invoice', ...name, 'price'], form)
  const amount = Form.useWatch(['invoice', ...name, 'amount'], form)
  const lastAmount = Form.useWatch(['invoice', ...name, 'lastAmount'], form)
  const losses = Form.useWatch(['invoice', ...name, 'losses'], form)

  const isChanged =
    price !== initialRef.current.price ||
    amount !== initialRef.current.amount ||
    lastAmount !== initialRef.current.lastAmount ||
    losses !== initialRef.current.losses

  const resetAll = () => {
    form.setFields([
      {
        name: ['invoice', ...name, 'price'],
        value: initialRef.current!.price,
      },
      {
        name: ['invoice', ...name, 'amount'],
        value: initialRef.current!.amount,
      },
      {
        name: ['invoice', ...name, 'lastAmount'],
        value: initialRef.current!.lastAmount,
      },
      {
        name: ['invoice', ...name, 'losses'],
        value: initialRef.current!.losses,
      },
    ])
  }

  return {
    isChanged,
    resetAll,
  }
}


export const Name: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
  editable,
}) => {
  const { service } = usePaymentContext()
  const name = useMemo(() => toArray<string>(_name), [_name])

  const losses = Form.useWatch(['invoice', ...name, 'losses'], form) ?? 0

  const { isChanged, resetAll } = useElectricityReset(
    form,
    name,
    service?.electricityPrice
  )

  return (
    <Flex justify="space-between" align="center">
      <Space direction="vertical" size={0}>
        <Typography.Text>Електропостачання</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: '0.75rem' }}>
          {toFirstUpperCase(dateToMonthYear(service?.date))}
          {losses > 0 ? ` + Втрати ${losses}%` : ''}
        </Typography.Text>
      </Space>

      {editable && isChanged && (
        <Tooltip title="Відновити значення">
          <UpdateInvoiceButton onClick={resetAll} />
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
  const name = useMemo(() => toArray<string>(_name), [_name])
  const { service, payment } = usePaymentContext()
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
                <strong>Втрати:</strong> {losses}%
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

  if (!editable) {
    return <span>{toRoundFixed(price)} грн/кВт</span>
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
        suffix="грн/кВт"
      />
    </Form.Item>
  )
}

export const Sum: React.FC<InvoiceComponentProps> = ({ form, name: _name }) => {
  const name = useMemo(() => toArray<string>(_name), [_name])
  const { service, payment } = usePaymentContext()
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

  return <strong>{toRoundFixed(sum)} грн</strong>
}

const Electricity = {
  Name,
  Amount,
  Price,
  Sum,
}

export default Electricity
