import { dateToMonthYear } from '@assets/features/formatDate'
import { usePaymentContext } from '@components/AddPaymentModal'
import { InvoiceComponentProps } from '@components/Tables/EditInvoiceTable'
import { currencyWithUnit, toArray, toFirstUpperCase, toRoundFixed } from '@utils/helpers'
import validator from '@utils/validator'
import { Form, Input, Space, Typography, Button, Tooltip } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { useContext, useEffect, useMemo } from 'react'

export const Name: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
  editable,
  disabled,
}) => {
  const { company, service } = usePaymentContext()
  const gardagePrice = service?.garbageCollectorPrice * (company?.rentPart / 100)

  return (
    <Space
      direction="horizontal"
      style={{ justifyContent: 'space-between', width: '100%' }}
    >
      <Space direction="vertical" size={0}>
        <Typography.Text>Вивіз ТПВ</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: '0.75rem' }}>
          {toFirstUpperCase(dateToMonthYear(service?.date))}
        </Typography.Text>
      </Space>
      {
        editable &&
        (gardagePrice !==
          Form.useWatch(['invoice', ...toArray<string>(_name), 'price'], form)) && (
          <Tooltip title="Відновити значення">
            <Button
              onClick={() => {
                form.setFieldValue(
                  ['invoice', ...toArray<string>(_name), 'price'],
                  gardagePrice
                )
              }}
              icon={<ReloadOutlined />}
            />
          </Tooltip>
        )
      }
    </Space>
  )
}

export const Amount: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
  editable,
  disabled,
}) => {
  const { service, company } = usePaymentContext()

  if (service?.garbageCollectorPrice && company?.rentPart) {
    return (
      <span>
        {toRoundFixed(company.rentPart)}% від{' '}
        {currencyWithUnit(toRoundFixed(service.garbageCollectorPrice), company)} ={' '}
      </span>
    )
  }
}

export const Price: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
  editable,
  disabled,
}) => {
  const name = useMemo(() => toArray<string>(_name), [_name])

  const price = Form.useWatch(['invoice', ...name, 'price'], form)
  const { company } = usePaymentContext()

  if (!editable) {
    return <span>{currencyWithUnit(toRoundFixed(price), company)}</span>
  }

  return (
    <Form.Item name={[...name, 'price']} rules={[validator.required()]} noStyle>
      <Input
        type="number"
        placeholder="Значення..."
        disabled={disabled}
        suffix={currencyWithUnit('', company)}
      />
    </Form.Item>
  )
}

export const Sum: React.FC<InvoiceComponentProps> = ({ form, name: _name }) => {
  const name = useMemo(() => toArray<string>(_name), [_name])

  const price = Form.useWatch(['invoice', ...name, 'price'], form)
  const sum = Form.useWatch(['invoice', ...name, 'sum'], form)
  const { company } = usePaymentContext()

  useEffect(() => {
    form.setFieldValue(['invoice', ...name, 'sum'], +price)
  }, [form, name, price])

  return <strong>{currencyWithUnit(toRoundFixed(sum), company)}</strong>
}

const GarbageCollector = {
  Name,
  Amount,
  Price,
  Sum,
}

export default GarbageCollector
