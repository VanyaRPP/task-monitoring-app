import React, { FC } from 'react'
import { validateField } from '@common/assets/features/validators'
import { Form, FormInstance, Input, Select } from 'antd'
import s from './style.module.scss'
import DomainStreets from './DomainStreets'

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
        rules={validateField('email')}
      >
        <Select mode="tags" placeholder="Пошти адмінів компанії" />
      </Form.Item>
      <DomainStreets />
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

      <Form.Item name="phone" label="Телефон" rules={validateField('phone')}>
        <Input
          placeholder="Вкажіть значення"
          maxLength={256}
          className={s.formInput}
        />
      </Form.Item>

      <Form.Item name="email" label="Пошта" rules={validateField('email')}>
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
