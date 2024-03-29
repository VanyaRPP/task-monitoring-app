import React, { FC } from 'react'
import { validateField } from '@common/assets/features/validators'
import { Form, FormInstance, Input } from 'antd'
import s from './style.module.scss'

interface Props {
  form: FormInstance<any>
}

const AddStreetForm: FC<Props> = ({ form }) => {
  return (
    <Form form={form} layout="vertical" className={s.Form}>
      <Form.Item
        required
        name="city"
        label="Місто"
        rules={validateField('city')}
      >
        <Input
          placeholder="Введіть місто"
          maxLength={256}
          className={s.formInput}
        />
      </Form.Item>
      <Form.Item
        required
        name="address"
        label="Адреса"
        rules={validateField('address')}
      >
        <Input
          placeholder="Введіть адресу"
          maxLength={256}
          className={s.formInput}
        />
      </Form.Item>
    </Form>
  )
}

export default AddStreetForm
