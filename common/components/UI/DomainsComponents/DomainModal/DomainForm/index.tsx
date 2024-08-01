import React, { FC } from 'react'
import { validateField } from '@common/assets/features/validators'
import { Form, FormInstance, Input } from 'antd'
import s from './style.module.scss'
import DomainStreets from './DomainStreets'
import EmailSelect from '@common/components/UI/Reusable/EmailSelect'

interface Props {
  form: FormInstance<any>
  editable?: boolean
  setIsValueChanged: (value: boolean) => void
}

const DomainForm: FC<Props> = ({
  form,
  editable = true,
  setIsValueChanged,
}) => {
  return (
    <Form
      form={form}
      requiredMark={editable}
      layout="vertical"
      className={s.Form}
      onValuesChange={() => setIsValueChanged(true)}
    >
      <Form.Item name="name" label="Назва" rules={validateField('required')}>
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
        rules={validateField('required')}
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
