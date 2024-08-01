import { validateField } from '@assets/features/validators'
import EmailSelect from '@components/UI/Reusable/EmailSelect'
import { Form, FormInstance, Input } from 'antd'
import { FC } from 'react'
import DomainStreets from './DomainStreets'
import s from './style.module.scss'

interface Props {
  form: FormInstance<any>
  editable?: boolean
}

const DomainForm: FC<Props> = ({ form, editable = true }) => {
  return (
    <Form
      form={form}
      requiredMark={editable}
      layout="vertical"
      className={s.Form}
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
