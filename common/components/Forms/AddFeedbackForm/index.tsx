import {
  deleteExtraWhitespace,
  validateField,
} from '@assets/features/validators'
import { Form, FormInstance, Input, Rate } from 'antd'
import React from 'react'
import s from './style.module.scss'

interface Props {
  isFormDisabled: boolean
  form: FormInstance
  setIsValueChanged?: (value: boolean) => void
}

const AddFeedbackForm: React.FC<Props> = ({
  isFormDisabled,
  form,
  setIsValueChanged,
}) => {
  return (
    <Form
      form={form}
      layout="vertical"
      name="form_in_modal"
      disabled={isFormDisabled}
      onValuesChange={() => setIsValueChanged(true)}
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
