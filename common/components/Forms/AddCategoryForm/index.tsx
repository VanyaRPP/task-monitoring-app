import { Form, FormInstance, Input } from 'antd'
import { useEffect } from 'react'
import { useGetCategoryByIdQuery } from '../../../api/categoriesApi/category.api'
import {
  deleteExtraWhitespace,
  validateField,
} from '../../../assets/features/validators'

type PropsType = {
  isFormDisabled: boolean
  form: FormInstance
  id: string
}

const AddCategoryForm: React.FC<PropsType> = ({ isFormDisabled, form, id }) => {
  const { data } = useGetCategoryByIdQuery(id)

  useEffect(() => {
    if (id) {
      form.setFieldsValue({
        name: data?.data?.name,
        description: data?.data?.description,
      })
    }
  }, [data, form, id])

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
