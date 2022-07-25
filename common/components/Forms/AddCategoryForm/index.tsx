import { Form, FormInstance, Input } from 'antd'
import {
  deleteExtraWhitespace,
  validateField,
} from '../../../assets/features/validators'

type PropsType = {
  isFormDisabled: boolean
  form: FormInstance
}

const AddCategoryForm: React.FC<PropsType> = ({ isFormDisabled, form }) => {
  return (
    <Form
      form={form}
      layout="vertical"
      name="form_in_modal"
      disabled={isFormDisabled}
    >
      <Form.Item
        name="name"
        label="Назва категорії"
        normalize={deleteExtraWhitespace}
        rules={validateField('name')}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="description"
        label="Опис категорії"
        normalize={deleteExtraWhitespace}
        rules={validateField('description')}
      >
        <Input.TextArea />
      </Form.Item>
    </Form>
  )
}
export default AddCategoryForm
