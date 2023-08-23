import { Form, FormInstance, Input } from 'antd'
import { NamePath } from 'antd/lib/form/interface'
import { useEffect } from 'react'

const FormAttribute: React.FC<{
  form: FormInstance
  value: any
  name: NamePath
  disabled?: boolean
}> = ({ form, value, name, disabled }) => {
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
