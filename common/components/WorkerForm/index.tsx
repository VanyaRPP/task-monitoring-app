import { Form, FormInstance, Input, Select } from 'antd'
import { Option } from 'antd/lib/mentions'

type PropsType = {
  isFormDisabled: boolean
  form: FormInstance
}

const WorkerForm: React.FC<PropsType> = ({ isFormDisabled, form }) => {
  const prefixSelector = (
    <Form.Item name="prefix" noStyle>
      <Select defaultValue="380" style={{ width: 80 }}>
        <Option value="380">+380</Option>
      </Select>
    </Form.Item>
  )
  return (
    <Form
      form={form}
      layout="vertical"
      name="form_in_modal"
      disabled={isFormDisabled}
    >
      <Form.Item
        name="tel"
        label="Ромер телефону"
        rules={[
          {
            required: true,
            message: 'Введіть свій номер телефону, будь ласка!',
          },
        ]}
      >
        <Input addonBefore={prefixSelector} style={{ width: '100%' }} />
      </Form.Item>
    </Form>
  )
}
export default WorkerForm
