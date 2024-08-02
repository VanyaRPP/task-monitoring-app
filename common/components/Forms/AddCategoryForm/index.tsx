import {
  deleteExtraWhitespace,
  validateField,
} from '@assets/features/validators'
import { Form, FormInstance, Input } from 'antd'
import { useEffect } from 'react'
import { useGetCategoryByIdQuery } from '../../../api/categoriesApi/category.api'

type PropsType = {
  isFormDisabled: boolean
  form: FormInstance
  id: string
  setIsValueChanged: (value: boolean) => void
}

const AddCategoryForm: React.FC<PropsType> = ({
  isFormDisabled,
  form,
  id,
  setIsValueChanged,
}) => {
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
      onValuesChange={() => setIsValueChanged(true)}
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
