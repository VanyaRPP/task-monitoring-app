import React from 'react'
import { Form, FormInstance, Input, Slider } from 'antd'

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
      <Form.Item name="text" label="Your feedback">
        <Input.TextArea />
      </Form.Item>

      <Form.Item name="grade" label="Your grade">
        <Slider
          min={1}
          max={5}
          step={1}
          marks={{
            1: 1,
            2: 2,
            3: 3,
            4: 4,
            5: 5,
          }}
        />
      </Form.Item>
    </Form>
  )
}
export default AddFeedbackForm
