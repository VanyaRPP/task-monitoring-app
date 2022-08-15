import React from 'react'
import { Form, FormInstance, Input, Rate } from 'antd'
import {
  deleteExtraWhitespace,
  validateField,
} from '../../../assets/features/validators'
import s from './style.module.scss'

interface Props {
  isFormDisabled: boolean
  form: FormInstance
}

const AddFeedbackForm: React.FC<Props> = ({ isFormDisabled, form }) => {
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
        label="Ваш відгук"
        rules={validateField('feedback')}
      >
        <Input.TextArea maxLength={250} />
      </Form.Item>

      <Form.Item name="grade" label="Ваша оцінка">
        <Rate defaultValue={1} className={s.Rate} />
      </Form.Item>
    </Form>
  )
}
export default AddFeedbackForm
