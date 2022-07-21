import { Form, FormInstance, Input } from 'antd'
import { allowOnlyNumbers, validateField } from '../validators'

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
        normalize={allowOnlyNumbers}
        rules={validateField('phone')}
      >
        <Input addonBefore="+380" style={{ width: '100%' }} />
      </Form.Item>
    </Form>
  )
}
export default WorkerForm
