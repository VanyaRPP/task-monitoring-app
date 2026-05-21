import { useEffect } from 'react'
import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'
import { Form, Tooltip, InputNumber, Input } from 'antd'
import validator from '@utils/validator'
import { ServiceType } from '@utils/constants'
import { inputNumberParser, toRoundFixed } from '@utils/helpers'
import { QuestionCircleOutlined } from '@ant-design/icons'

export const MaintenancePrice: React.FC<{ name: number }> = ({ name }) => {
  const { form } = useInvoicesPaymentContext()

  const servicePricePerMeter: number =
    Form.useWatch(
      ['payments', name, 'company', 'servicePricePerMeter'],
      form
    ) ?? 0

  return (
    <Tooltip
      title={
        !!servicePricePerMeter &&
        'Індивідуальне утримання, що передбачене договором'
      }
    >
      <Form.Item
        name={[name, 'invoice', ServiceType.Maintenance, 'price']}
        style={{ margin: 0 }}
        rules={[validator.required(), validator.min(0)]}
      >
        <InputNumber
          style={{ width: 'auto' }}
          parser={inputNumberParser}
          suffix={!!servicePricePerMeter && <QuestionCircleOutlined />}
        />
      </Form.Item>
    </Tooltip>
  )
}

export const MaintenanceSum: React.FC<{ name: number }> = ({ name }) => {
  const { form } = useInvoicesPaymentContext()

  const totalArea: number =
    Form.useWatch(['payments', name, 'company', 'totalArea'], form) ?? 0
  const price: number =
    Form.useWatch(
      ['payments', name, 'invoice', ServiceType.Maintenance, 'price'],
      form
    ) ?? 0

  useEffect(() => {
    form.setFieldValue(
      ['payments', name, 'invoice', ServiceType.Maintenance, 'sum'],
      +toRoundFixed(+totalArea * +price)
    )
  }, [form, name, totalArea, price])

  return (
    <Form.Item
      name={[name, 'invoice', ServiceType.Maintenance, 'sum']}
      style={{ margin: 0 }}
      rules={[validator.required(), validator.min(0)]}
    >
      <Input type="number" disabled />
    </Form.Item>
  )
}
