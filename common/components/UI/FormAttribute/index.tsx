import { Form, FormInstance, Input } from 'antd'
import { NamePath } from 'antd/lib/form/interface'
import { useEffect } from 'react'

const FormAttribute: React.FC<{
  form: FormInstance
  value: any
  name: NamePath
  editable?: boolean
  onChange?: (value: any) => void
}> = ({ form, value, name, editable, onChange }) => {
  useEffect(() => {
    form.setFieldValue(name, value)
  }, [value])

  const handleChange = () => onChange && onChange(form.getFieldValue(name))

  return (
    <Form.Item initialValue={value} style={{ margin: 0 }} name={name}>
      {editable ? (
        <Input onBlur={handleChange} onPressEnter={handleChange} />
      ) : (
        value
      )}
    </Form.Item>
  )
}

export default FormAttribute
