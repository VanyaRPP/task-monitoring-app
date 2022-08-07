import React from 'react'
import { Form, FormInstance, Input, Slider, Rate } from 'antd'
import {
  deleteExtraWhitespace,
  validateField,
} from '../../../assets/features/validators'

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

      <Form.Item name="grade" label="Your grade">
        {/* <Slider
          min={0}
          max={5}
          step={1}
          marks={{
            0: 0,
            1: 1,
            2: 2,
            3: 3,
            4: 4,
            5: 5,
          }}
        /> */}
        <Rate defaultValue={1} />
      </Form.Item>
    </Form>
  )
}
export default AddFeedbackForm
