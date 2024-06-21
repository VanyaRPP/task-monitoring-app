import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'
import { toRoundFixed } from '@utils/helpers'
import { Form, FormInstance, Input } from 'antd'
import { NamePath } from 'antd/lib/form/interface'
import { useEffect } from 'react'

const FormAttribute: React.FC<{
  value: any
  name: NamePath
  disabled?: boolean
  notNum?: boolean
}> = ({ value, name, disabled, notNum }) => {
  const { form }: { form: FormInstance } = useInvoicesPaymentContext()

  useEffect(() => {
    form.setFieldValue(name, notNum ? value : toRoundFixed(value?.toString()))
  }, [form, name, notNum, value])

  return (
    <Form.Item style={{ margin: 0 }} name={name}>
      <Input disabled={disabled} />
    </Form.Item>
  )
}

export default FormAttribute
