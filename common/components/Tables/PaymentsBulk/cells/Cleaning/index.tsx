import { useEffect } from 'react'
import { useInvoicesPaymentContext } from '@components/DashboardPage/blocks/paymentsBulk'
import { Form, InputNumber } from 'antd'
import { ServiceType } from '@utils/constants'
import { toRoundFixed, inputNumberParser } from '@utils/helpers'
import validator from '@utils/validator'

export const Cleaning: React.FC<{ name: number }> = ({ name }) => {
  const { form } = useInvoicesPaymentContext()

  const cleaning: boolean =
    Form.useWatch(['payments', name, 'company', 'cleaning'], form) ?? false

  const price: number =
    Form.useWatch(
      ['payments', name, 'invoice', ServiceType.Cleaning, 'price'],
      form
    ) ?? 0

  useEffect(() => {
    if (cleaning) {
      const sum = +toRoundFixed(price ?? 0)
      form.setFieldValue(
        ['payments', name, 'invoice', ServiceType.Cleaning, 'sum'],
        sum
      )
    }
  }, [form, name, price, cleaning])

  if (cleaning) {
    return (
      <Form.Item
        name={[name, 'invoice', ServiceType.Cleaning, 'price']}
        style={{ margin: 0 }}
        rules={[validator.required(), validator.min(0)]}
      >
        <InputNumber parser={inputNumberParser} style={{ width: 'auto' }} />
      </Form.Item>
    )
  }
}
