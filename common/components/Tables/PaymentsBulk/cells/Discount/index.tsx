import { useEffect } from "react"
import { Form, InputNumber } from 'antd'
import { ServiceType } from "@utils/constants"
import { useInvoicesPaymentContext } from "@components/DashboardPage/blocks/paymentsBulk"
import validator from "@utils/validator"
import { toRoundFixed, inputNumberParser } from "@utils/helpers"

export const Discount: React.FC<{ name: number }> = ({ name }) => {
  const { form } = useInvoicesPaymentContext()

  const price: number =
    Form.useWatch(
      ['payments', name, 'invoice', ServiceType.Discount, 'price'],
      form
    ) ?? 0

  useEffect(() => {
    const sum = +toRoundFixed(price ?? 0)
    form.setFieldValue(
      ['payments', name, 'invoice', ServiceType.Discount, 'sum'],
      sum
    )
  }, [form, name, price])

  return (
    <Form.Item
      name={[name, 'invoice', ServiceType.Discount, 'price']}
      style={{ margin: 0 }}
      rules={[validator.required(), validator.max(0)]}
    >
      <InputNumber parser={inputNumberParser} style={{ width: 'auto' }} />
    </Form.Item>
  )
}