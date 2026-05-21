import { useEffect } from 'react'
import { Form, Space, Typography, Input, InputNumber } from 'antd'
import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'
import { ServiceType } from '@utils/constants'
import { toRoundFixed, inputNumberParser } from '@utils/helpers'
import validator from '@utils/validator'

export const WaterPartSumTitle: React.FC = () => {
  const { service } = useInvoicesPaymentContext()

  return (
    <Space>
      <Typography.Text>Загальне</Typography.Text>
      {!!service?.waterPrice && (
        <Typography.Text type="secondary" style={{ fontWeight: 'lighter' }}>
          {toRoundFixed(service.waterPriceTotal)} грн
        </Typography.Text>
      )}
    </Space>
  )
}

export const WaterPartAmount: React.FC<{ name: number }> = ({ name }) => {
  const { form } = useInvoicesPaymentContext()

  const waterPart: number =
    Form.useWatch(['payments', name, 'company', 'waterPart'], form) ?? 0

  if (waterPart) {
    return (
      <Form.Item
        name={[name, 'company', 'waterPart']}
        style={{ margin: 0 }}
        rules={[validator.required(), validator.min(0)]}
      >
        <Input type="number" disabled />
      </Form.Item>
    )
  }
}

export const WaterPartSum: React.FC<{ name: number }> = ({ name }) => {
  const { form } = useInvoicesPaymentContext()

  const waterPart: number =
    Form.useWatch(['payments', name, 'company', 'waterPart'], form) ?? 0

  const price: number =
    Form.useWatch(
      ['payments', name, 'invoice', ServiceType.WaterPart, 'price'],
      form
    ) ?? 0

  useEffect(() => {
    if (waterPart) {
      const sum = +toRoundFixed(price ?? 0)
      form.setFieldValue(
        ['payments', name, 'invoice', ServiceType.WaterPart, 'sum'],
        sum
      )
    }
  }, [form, name, price, waterPart])

  if (waterPart) {
    return (
      <Form.Item
        name={[name, 'invoice', ServiceType.WaterPart, 'price']}
        style={{ margin: 0 }}
        rules={[validator.required(), validator.min(0)]}
      >
        <InputNumber parser={inputNumberParser} />
      </Form.Item>
    )
  }
}
