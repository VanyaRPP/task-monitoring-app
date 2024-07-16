import React, { FC } from 'react'
import { validateField } from '@common/assets/features/validators'
import { Form, FormInstance, Input } from 'antd'
import s from './style.module.scss'
import DomainStreets from './DomainStreets'
import EmailSelect from '@common/components/UI/Reusable/EmailSelect'

interface Props {
  form: FormInstance<any>
  editable?: boolean
  disabled?: boolean
}

const DomainForm: FC<Props> = ({ form, editable = true, disabled = false }) => {

  const nameValue = Form.useWatch('name', form)
  const descriptionValue = Form.useWatch('description', form)

  return (
    <Form
      form={form}
      layout="vertical"
      className={s.Form}
    >
      <Form.Item name="name" label="Назва" rules={editable && validateField('required')}>
        {editable ? (
          <Input
            placeholder="Вкажіть значення"
            maxLength={256}
            className={s.formInput}
            disabled={disabled}
          />
        ) : (
          <div>{nameValue}</div>
        )}
      </Form.Item>
      <EmailSelect form={form} disabled={!editable} />
      <DomainStreets disabled={!editable} />
      <Form.Item
        name="description"
        label="Опис"
        rules={editable && validateField('required')}
      >
        {editable ? (
          <Input.TextArea
            placeholder="Вкажіть значення"
            className={s.formInput}
            maxLength={512}
            rows={4}
            disabled={disabled}
          />
        ) : (
          <div>{descriptionValue}</div>
        )}
      </Form.Item>
    </Form>
  )
}

export default DomainForm
