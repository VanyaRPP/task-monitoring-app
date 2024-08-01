import React, { FC } from 'react'
import { validateField } from '@common/assets/features/validators'
import { Form, FormInstance, Input } from 'antd'
import s from './style.module.scss'

interface Props {
  form: FormInstance<any>
  editable?: boolean
  setIsValueChanged: (value: boolean) => void
}

const AddStreetForm: FC<Props> = ({ form, editable, setIsValueChanged }) => {
  return (
    <Form
      form={form}
      layout="vertical"
      className={s.Form}
      onValuesChange={() => setIsValueChanged(true)}
    >
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
          disabled={!editable}
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
          disabled={!editable}
        />
      </Form.Item>
    </Form>
  )
}

export default AddStreetForm
