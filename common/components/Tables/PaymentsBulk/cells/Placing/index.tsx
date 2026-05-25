import { useEffect } from 'react'
import { Form, InputNumber, Tooltip } from 'antd'
import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'
import { ServiceType } from '@utils/constants'
import { inputNumberParser, toRoundFixed } from '@utils/helpers'
import validator from '@utils/validator'
import { useInflicionValues } from '@components/Tables/PaymentsBulk/hooks/useInflicionValues/useInflicionValues'
import { QuestionCircleOutlined } from '@ant-design/icons'

export const PlacingSum: React.FC<{ name: number }> = ({ name }) => {
  const { form } = useInvoicesPaymentContext()

  const { previousPlacingPrice, inflicionAmount } = useInflicionValues(name)

  const inflicion: boolean =
    Form.useWatch(['payments', name, 'company', 'inflicion'], form) ?? false
  const totalArea: number =
    Form.useWatch(['payments', name, 'company', 'totalArea'], form) ?? 0
  const price: number =
    Form.useWatch(
      ['payments', name, 'invoice', ServiceType.Placing, 'price'],
      form
    ) ?? 0

  useEffect(() => {
    form.setFieldValue(
      ['payments', name, 'invoice', ServiceType.Placing, 'sum'],
      +toRoundFixed(inflicion ? price : price * totalArea)
    )
  }, [form, name, price, inflicion, totalArea])

  return (
    <Tooltip
      title={
        inflicion &&
        `Значення попереднього місяця + значення інфляції в цьому рахунку (${toRoundFixed(
          previousPlacingPrice
        )} + ${toRoundFixed(inflicionAmount)})`
      }
    >
      <Form.Item
        name={[name, 'invoice', ServiceType.Placing, 'sum']}
        style={{ margin: 0 }}
        rules={[validator.required(), validator.min(0)]}
      >
        <InputNumber
          parser={inputNumberParser}
          suffix={inflicion && <QuestionCircleOutlined />}
          style={{ width: 'auto' }}
          disabled={!inflicion}
        />
      </Form.Item>
    </Tooltip>
  )
}

export const PlacingPrice: React.FC<{ name: number }> = ({ name }) => {
  const { form } = useInvoicesPaymentContext()

  const inflicion: boolean =
    Form.useWatch(['payments', name, 'company', 'inflicion'], form) ?? false

  return inflicion ? (
    <Tooltip title="Нарахуванян відбувається згідно з ростом інфляції">
      Інфляційне нархування <QuestionCircleOutlined />
    </Tooltip>
  ) : (
    <Form.Item
      name={[name, 'invoice', ServiceType.Placing, 'price']}
      style={{ margin: 0 }}
      rules={[validator.required(), validator.min(0)]}
    >
      <InputNumber parser={inputNumberParser} style={{ width: 'auto' }} />
    </Form.Item>
  )
}
