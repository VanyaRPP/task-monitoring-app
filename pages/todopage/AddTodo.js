import React, { useState } from 'react'
import s from './style.module.scss'
import PropTypes from 'prop-types'
import { Button, Form, Input } from 'antd'

function useInputValue(defaultValue) {
  const [value, setValue] = useState(defaultValue)

  return {
    bind: {
      value,
      onChange: (event) => setValue(event.target.value),
    },
    clear: () => setValue(''),
    value: () => value,
  }
}

function AddTodo({ onCreate }) {
  const [form] = Form.useForm()

  function submitHandler(formData) {
    onCreate(formData.title)
    form.resetFields()
  }

  return (
    <Form form={form} name="form" onFinish={submitHandler} className={s.Form}>
      <Form.Item name="title">
        <Input className={s.Search} />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          Add note
        </Button>
      </Form.Item>
    </Form>
  )
}

AddTodo.propTypes = {
  onCreate: PropTypes.func.isRequired,
}

export default AddTodo
