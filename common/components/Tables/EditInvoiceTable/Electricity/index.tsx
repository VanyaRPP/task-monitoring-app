import { dateToMonthYear } from '@assets/features/formatDate'
import { usePaymentContext } from '@components/AddPaymentModal'
import { InvoiceComponentProps } from '@components/Tables/EditInvoiceTable'
import { DividedSpace } from '@components/UI/DividedSpace'
import { toArray, toFirstUpperCase, toRoundFixed } from '@utils/helpers'
import validator from '@utils/validator'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { Form, Input, Space, Typography, Tooltip } from 'antd'
import { useEffect, useMemo } from 'react'

export const Name: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
  editable,
  disabled,
}) => {
  const { service } = usePaymentContext()

  return (
    <Space direction="vertical" size={0}>
      <Typography.Text>Електропостачання</Typography.Text>
      <Typography.Text type="secondary" style={{ fontSize: '0.75rem' }}>
        {toFirstUpperCase(dateToMonthYear(service?.date))}{' '}
        {service?.losses > 0 ? `+ Втрати ${service?.losses}%` : ''}
      </Typography.Text>
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
  const { service } = usePaymentContext()
  const lastAmount = Form.useWatch(['invoice', ...name, 'lastAmount'], form)
  const amount = Form.useWatch(['invoice', ...name, 'amount'], form)

  if (!editable) {
    return service?.losses > 0 ? (
      editable ? (
        <div style={{ lineHeight: '1.6' }}>
          <Typography.Text>
            {toRoundFixed(lastAmount)} → {toRoundFixed(amount)} кВт
          </Typography.Text>
          <br />
          <Typography.Text>
            З втратами ({service?.losses}%):{' '}
            <Typography.Text underline strong>
              {amount -
                lastAmount +
                (amount - lastAmount) * (service?.losses / 100)}{' '}
              кВт
            </Typography.Text>
          </Typography.Text>
        </div>
      ) : (
        <DividedSpace style={{ cursor: 'pointer' }}>
          <Typography.Text>
            {toRoundFixed(lastAmount)} → {toRoundFixed(amount)} кВт
          </Typography.Text>
          <Tooltip
            title={
              <div>
                <div>
                  <strong>Втрати:</strong> {service?.losses}%
                </div>
                <div>
                  <strong>З втратами:</strong>{' '}
                  {amount -
                    lastAmount +
                    (amount - lastAmount) * (service?.losses / 100)}{' '}
                  кВт
                </div>
              </div>
            }
          >
            <ExclamationCircleOutlined
              style={{ color: '#faad14', marginLeft: 8, cursor: 'pointer' }}
            />
          </Tooltip>
        </DividedSpace>
      )
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

  const lastAmount = Form.useWatch(['invoice', ...name, 'lastAmount'], form)
  const amount = Form.useWatch(['invoice', ...name, 'amount'], form)
  const price = Form.useWatch(['invoice', ...name, 'price'], form)
  const sum = Form.useWatch(['invoice', ...name, 'sum'], form)
  const { service } = usePaymentContext()
  const loss =
    amount - lastAmount + (amount - lastAmount) * (service?.losses / 100)

  useEffect(() => {
    form.setFieldValue(
      ['invoice', ...name, 'sum'],
      service?.losses > 0
        ? (Math.max(+amount - +lastAmount, 0) + loss) * +price
        : Math.max(+amount - +lastAmount, 0) * +price
    )
  }, [form, name, amount, lastAmount, price])

  return <strong>{toRoundFixed(sum)} грн</strong>
}

const Electricity = {
  Name,
  Amount,
  Price,
  Sum,
}

export default Electricity
