import React, { FC } from 'react'
import { useGetAllUsersQuery } from '@common/api/userApi/user.api'
import { validateField } from '@common/assets/features/validators'
import { Form, FormInstance, Input, InputNumber, Select } from 'antd'
import s from './style.module.scss'
import type { DatePickerProps } from 'antd'
import { DatePicker, Space } from 'antd'

const onChange: DatePickerProps['onChange'] = (date, dateString) => {
  //console.warn(date, dateString)
}

interface Props {
  form: FormInstance<any>
}

const AddServiceForm: FC<Props> = ({ form }) => {
  const { Option } = Select
  const { data: users } = useGetAllUsersQuery('')
  const dayjs = require('dayjs')

  return (
    <Form form={form} layout="vertical" className={s.Form}>
      <Form.Item
        name="date"
        label="Місяць та рік"
        rules={validateField('data')}
      >
        <Space direction="vertical">
          <DatePicker onChange={onChange} defaultValue={dayjs} picker="month" />
        </Space>
      </Form.Item>
      <Form.Item
        name="orenda"
        label="Утримання приміщень"
        // rules={validateField('required')}
      >
        <InputNumber
          type="number"
          style={{ width: '32%' }}
          className={s.InputNumber}
        />
      </Form.Item>
      <Form.Item
        name="electricPrice"
        label="Електроенергія"
        // rules={validateField('electricPrice')}
      >
        <InputNumber
          type="number"
          style={{ width: '32%' }}
          className={s.InputNumber}
        />
      </Form.Item>
      <Form.Item
        name="waterPrice"
        label="Водопостачання"
        // rules={validateField('required')}
      >
        <InputNumber
          type="number"
          style={{ width: '32%' }}
          className={s.InputNumber}
        />
      </Form.Item>
      <Form.Item
        name="inflaPrice"
        label="Індекс інфляції"
        // rules={validateField('required')}
      >
        <InputNumber
          type="number"
          style={{ width: '32%' }}
          className={s.InputNumber}
        />
      </Form.Item>
      <Form.Item
        name="description"
        label="Опис"
        // rules={validateField('required')}
      >
        <Input.TextArea
          placeholder="Введіть опис"
          style={{ width: '90%' }}
          maxLength={256}
        />
      </Form.Item>
    </Form>
  )
}

export default AddServiceForm
