import { useEffect } from 'react'
import { Form, Space, Typography, Input, InputNumber } from 'antd'
import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'
import { ServiceType } from '@utils/constants'
import { toRoundFixed, inputNumberParser } from '@utils/helpers'
import validator from '@utils/validator'

// Invoice key these cells read/write. Defaults to ServiceType.Water for the
// native column; a per-domain custom "water" service passes its own key.
type Keyed = { name: number; fieldName?: string }

export const WaterSumTitle: React.FC = () => {
  const { service } = useInvoicesPaymentContext()

  return (
    <Space>
      <Typography.Text>Загальне</Typography.Text>
      {!!service?.waterPrice && (
        <Typography.Text type="secondary" style={{ fontWeight: 'lighter' }}>
          {toRoundFixed(service.waterPrice)} грн/м<sup>3</sup>
        </Typography.Text>
      )}
    </Space>
  )
}

export const WaterAmount: React.FC<Keyed & { last?: boolean }> = ({
  name,
  fieldName = ServiceType.Water,
  last = false,
}) => {
  const { form } = useInvoicesPaymentContext()

  const waterPart: number =
    Form.useWatch(['payments', name, 'company', 'waterPart'], form) ?? 0

  // The waterPart split only hides the NATIVE water meter (WaterPart takes over).
  // Custom water services are independent meters and always render.
  const gated = fieldName === ServiceType.Water && !!waterPart
  if (gated) return null

  return (
    <Form.Item
      name={[name, 'invoice', fieldName, last ? 'lastAmount' : 'amount']}
      style={{ margin: 0 }}
      rules={[validator.required(), validator.min(0)]}
    >
      <InputNumber parser={inputNumberParser} />
    </Form.Item>
  )
}

export const WaterSum: React.FC<Keyed> = ({
  name,
  fieldName = ServiceType.Water,
}) => {
  const { form, service } = useInvoicesPaymentContext()

  const lastAmount: number =
    Form.useWatch(
      ['payments', name, 'invoice', fieldName, 'lastAmount'],
      form
    ) ?? 0
  const amount: number =
    Form.useWatch(['payments', name, 'invoice', fieldName, 'amount'], form) ?? 0

  const waterPart: number =
    Form.useWatch(['payments', name, 'company', 'waterPart'], form) ?? 0

  const gated = fieldName === ServiceType.Water && !!waterPart

  useEffect(() => {
    if (gated) return
    const price = service?.waterPrice ?? 0
    const sum = +toRoundFixed((+amount - +lastAmount) * price)
    form.setFieldValue(['payments', name, 'invoice', fieldName, 'sum'], sum)
  }, [form, name, fieldName, amount, lastAmount, service, gated])

  if (gated) return null

  return (
    <Form.Item
      name={[name, 'invoice', fieldName, 'sum']}
      style={{ margin: 0 }}
      rules={[validator.required(), validator.min(0)]}
    >
      <Input type="number" disabled />
    </Form.Item>
  )
}
