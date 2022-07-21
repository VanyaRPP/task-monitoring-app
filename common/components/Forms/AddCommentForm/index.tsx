import React from 'react'
import { Form, FormInstance, Input } from 'antd'
import { deleteExtraWhitespace, validateField } from '../validators'

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
      <Form.Item
        normalize={deleteExtraWhitespace}
        name="text"
        label="Your comment"
        rules={validateField('comment')}
      >
        <Input.TextArea maxLength={250} />
      </Form.Item>
    </Form>
  )
}
export default AddCommentForm
