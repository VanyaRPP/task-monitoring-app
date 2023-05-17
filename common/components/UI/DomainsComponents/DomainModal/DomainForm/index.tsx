import React, { FC } from 'react'
import { validateField } from '@common/assets/features/validators'
import { Select, Form, FormInstance, Input, InputNumber } from 'antd'
import s from './style.module.scss'

interface Props {
  form: FormInstance<any>
}

const DomainForm: FC<Props> = ({ form }) => {
  return (
    <Form form={form} layout="vertical" className={s.Form}>
      <Form.Item name="name" label="Назва" rules={validateField('description')}>
        <Input
          placeholder="Вкажіть значення"
          maxLength={256}
          className={s.formInput}
        />
      </Form.Item>
      <Form.Item name="address" label="Адреса" rules={validateField('address')}>
        <Input
          placeholder="Пошук адреси"
          maxLength={256}
          className={s.formInput}
        />
      </Form.Item>
      <Form.Item
        name="adminEmails"
        label="Адміністратори"
        rules={validateField('required')}
      >
        <Select mode="tags" placeholder="Пошти адмінів компанії" />
      </Form.Item>
      <Form.Item
        name="streets"
        label="Вулиця"
        rules={validateField('required')}
      >
        <Input
          placeholder="Вкажіть значення"
          maxLength={256}
          className={s.formInput}
        />
      </Form.Item>
      <Form.Item
        name="description"
        label="Опис"
        rules={validateField('required')}
      >
        <Input
          placeholder="Вкажіть значення"
          maxLength={256}
          className={s.formInput}
        />
      </Form.Item>

      <Form.Item
        name="bankInformation"
        label="Отримувач"
        rules={validateField('required')}
      >
        <Input
          placeholder="Отримувач рахунку"
          maxLength={256}
          className={s.formInput}
        />
      </Form.Item>

      <Form.Item name="phone" label="Телефон" rules={validateField('required')}>
        <Input
          placeholder="Вкажіть значення"
          maxLength={256}
          className={s.formInput}
        />
      </Form.Item>

      <Form.Item name="email" label="Пошта" rules={validateField('required')}>
        <Input
          placeholder="Вкажіть значення"
          maxLength={256}
          className={s.formInput}
        />
      </Form.Item>
    </Form>
  )
}

export default DomainForm
