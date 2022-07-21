import React from 'react'
import { Form, FormInstance, Input } from 'antd'

interface Props {
  isFormDisabled: boolean
  form: FormInstance
}

const AddCommentForm: React.FC<Props> = ({ isFormDisabled, form }) => {
  return (
    <Form
      form={form}
      layout="vertical"
      name="form_in_modal"
      disabled={isFormDisabled}
    >
      <Form.Item name="text" label="Your comment">
        <Input.TextArea />
      </Form.Item>
    </Form>
  )
}
export default AddCommentForm
