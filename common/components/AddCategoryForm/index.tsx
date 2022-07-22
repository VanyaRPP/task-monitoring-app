import { Form, FormInstance, Input } from 'antd'

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
        rules={[{ required: true }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="desription"
        label="Опис категорії"
        rules={[{ required: true }]}
      >
        <Input.TextArea />
      </Form.Item>
    </Form>
  )
}
export default AddCategoryForm
