import { useEffect } from 'react'
import { Form, Space, Typography, Input } from 'antd'
import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'
import { ServiceType } from '@utils/constants'
import { toRoundFixed } from '@utils/helpers'
import validator from '@utils/validator'
import { dateToMonth } from '@common/assets/features/formatDate'

export const InflicionTitle: React.FC = () => {
  const { prevService } = useInvoicesPaymentContext()

  return (
    <Space direction="vertical" size={0}>
      <Typography.Text>Індекс інфляції</Typography.Text>
      {prevService?.inflicionPrice ? (
        <Typography.Text type="secondary" style={{ fontWeight: 'lighter' }}>
          {toRoundFixed(prevService.inflicionPrice)}% за{' '}
          {dateToMonth(prevService.date)}
        </Typography.Text>
      ) : (
        <Typography.Text type="secondary" style={{ fontWeight: 'lighter' }}>
          за {dateToMonth(prevService?.date)} невідомий
        </Typography.Text>
      )}
    </Space>
  )
}

export const InflicionSum: React.FC<{ name: number }> = ({ name }) => {
  const { form } = useInvoicesPaymentContext()

  const inflicion: boolean =
    Form.useWatch(['payments', name, 'company', 'inflicion'], form) ?? false
  const price: number =
    Form.useWatch(
      ['payments', name, 'invoice', ServiceType.Inflicion, 'price'],
      form
    ) ?? 0

  useEffect(() => {
    if (inflicion) {
      form.setFieldValue(
        ['payments', name, 'invoice', ServiceType.Inflicion, 'sum'],
        +toRoundFixed(price)
      )
    }
  }, [form, name, price, inflicion])

  if (inflicion) {
    return (
      <Form.Item
        name={[name, 'invoice', ServiceType.Inflicion, 'price']}
        style={{ margin: 0 }}
        rules={[validator.required(), validator.min(0)]}
      >
        <Input type="number" disabled />
      </Form.Item>
    )
  }
}