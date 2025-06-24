import { dateToMonthYear } from '@assets/features/formatDate'
import { usePaymentContext } from '@components/AddPaymentModal'
import { InvoiceComponentProps } from '@components/Tables/EditInvoiceTable'
import { toArray, toFirstUpperCase, toRoundFixed } from '@utils/helpers'
import validator from '@utils/validator'
import { Form, Input, Space, Typography, Tooltip, Button } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
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
      <Typography.Text>Частка водопостачання</Typography.Text>
      <Typography.Text type="secondary" style={{ fontSize: '0.75rem' }}>
        {toFirstUpperCase(dateToMonthYear(service?.date))}
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
  const { service, company } = usePaymentContext()
  const name = useMemo(() => toArray<string>(_name), [_name])
  const waterPartPrice = +((service?.waterPriceTotal * company?.waterPart) / 100)
  const price = Form.useWatch(['invoice', ...name, 'price'], form)

  if (service?.garbageCollectorPrice && company?.rentPart) {
    return (
      <Space direction='horizontal' style={{ justifyContent: 'space-between', width: '100%' }}>
        <span>
          {toRoundFixed(company.waterPart)}% від{' '}
          {toRoundFixed(service.waterPriceTotal)} грн
        </span>
        {editable && waterPartPrice !== price &&
        (
          <Tooltip title="Відновити значення">
            <Button
              onClick={() => {
                form.setFieldValue(['invoice', ...name, 'price'], waterPartPrice)
              }}
              icon={<ReloadOutlined />}
            />
          </Tooltip>
        )}
      </Space>
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

  if (!editable) {
    return <span>{toRoundFixed(price)} грн</span>
  }

  return (
    <Form.Item name={[...name, 'price']} rules={[validator.required()]} noStyle>
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
