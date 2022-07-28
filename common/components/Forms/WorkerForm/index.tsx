import { Form, FormInstance, Input } from 'antd'
import {
  allowOnlyNumbers,
  validateField,
} from '../../../assets/features/validators'

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
        label="Номер телефону"
        normalize={allowOnlyNumbers}
        rules={validateField('phone')}
      >
        <Input addonBefore="+380" style={{ width: '100%' }} />
      </Form.Item>
    </Form>
  )
}
export default WorkerForm
