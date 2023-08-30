import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'
import { Form, FormInstance, Input } from 'antd'
import { NamePath } from 'antd/lib/form/interface'
import { useEffect } from 'react'

const FormAttribute: React.FC<{
  value: any
  name: NamePath
  disabled?: boolean
}> = ({ value, name, disabled }) => {
  const { form }: { form: FormInstance } = useInvoicesPaymentContext()

  useEffect(() => {
    form.setFieldValue(name, value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <Form.Item style={{ margin: 0 }} name={name}>
      <Input disabled={disabled} />
    </Form.Item>
  )
}

export default FormAttribute
