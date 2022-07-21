import { Form, FormInstance, Input } from 'antd'

type PropsType = {
  isFormDisabled: boolean
  form: FormInstance
}

const WorkerForm: React.FC<PropsType> = ({ isFormDisabled, form }) => {
  return (
    <Form
      form={form}
      layout="vertical"
      name="form_in_modal"
      disabled={isFormDisabled}
    >
      <Form.Item
        name="tel"
        label="Phone Number"
        normalize={(value) => value.replace(/[^+\d]/g, '')}
        rules={[
          { required: true, message: 'Please input your phone number!' },
          { len: 9, message: 'Phone number should have 9 digits!' },
        ]}
      >
        <Input addonBefore="+380" style={{ width: '100%' }} />
      </Form.Item>
    </Form>
  )
}
export default WorkerForm
