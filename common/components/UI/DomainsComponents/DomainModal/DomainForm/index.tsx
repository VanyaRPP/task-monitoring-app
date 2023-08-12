import React, { FC } from 'react'
import { validateField } from '@common/assets/features/validators'
import { Form, FormInstance, Input, Select } from 'antd'
import s from './style.module.scss'
import DomainStreets from './DomainStreets'
import EmailSelect from '@common/components/UI/Reusable/EmailSelect'

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
      <EmailSelect form={form} />
      <DomainStreets />
      <Form.Item
        name="description"
        label="Опис"
        rules={validateField('required')}
      >
        <Input.TextArea
          placeholder="Вкажіть значення"
          className={s.formInput}
          maxLength={512}
          rows={4}
        />
      </Form.Item>
    </Form>
  )
}

export default DomainForm
