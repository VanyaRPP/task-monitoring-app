import React, { FC } from 'react'
import { validateField } from '@common/assets/features/validators'
import { Form, FormInstance, Input } from 'antd'
import s from './style.module.scss'
import DomainStreets from './DomainStreets'
import EmailSelect from '@common/components/UI/Reusable/EmailSelect'

interface Props {
  form: FormInstance<any>
  editable?: boolean
}

const DomainForm: FC<Props> = ({ form, editable = true }) => {
  return (
    <Form form={form} layout="vertical" className={s.Form}>
      <Form.Item
        name="name"
        label="Назва"
        rules={editable && validateField('required')}
      >
        <Input
          placeholder="Вкажіть значення"
          maxLength={256}
          className={s.formInput}
          disabled={!editable}
        />
      </Form.Item>
      <EmailSelect form={form} disabled={!editable} />
      <DomainStreets disabled={!editable} />
      <Form.Item
        name="description"
        label="Опис"
        rules={editable && validateField('required')}
      >
        <Input.TextArea
          placeholder="Вкажіть значення"
          className={s.formInput}
          maxLength={512}
          rows={4}
          disabled={!editable}
        />
      </Form.Item>
    </Form>
  )
}

export default DomainForm
