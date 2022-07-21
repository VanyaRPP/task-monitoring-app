import { Form, FormInstance, Input } from 'antd'
import { deleteExtraWhitespace, validateField } from '../validators'

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
        label="Category name"
        normalize={deleteExtraWhitespace}
        rules={validateField('name')}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="description"
        label="Category description"
        normalize={deleteExtraWhitespace}
        rules={validateField('description')}
      >
        <Input.TextArea />
      </Form.Item>
    </Form>
  )
}
export default AddCategoryForm
