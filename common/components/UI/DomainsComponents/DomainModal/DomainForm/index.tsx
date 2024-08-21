import { validateField } from '@assets/features/validators'
import EmailSelect from '@components/UI/Reusable/EmailSelect'
import { Form, FormInstance, Input, Select, Space } from 'antd'
import { FC } from 'react'
import DomainStreets from './DomainStreets'
import s from './style.module.scss'

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
  const options = [
    {
      value: 'FOP',
      label: 'FOP',
    },
    {
      value: 'TOV',
      label: 'TOV',
    },
  ]
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
      {/* individual entrepreneur | FOP */}
      <Form.Item name="IE" label="FOP" rules={validateField('required')}>
        <Space.Compact className={s.formInput}>
          <Select
            style={{ width: '20%' }}
            defaultValue="FOP"
            options={options}
          />
          <Input
            placeholder="Вкажіть ФОП"
            maxLength={256}
            className={s.formInput}
            disabled={!editable}
          />
        </Space.Compact>
      </Form.Item>
      {/* IBAN */}
      <Form.Item name="IBAN" label="IBAN" rules={validateField('IBAN')}>
        <Input
          placeholder="Вкажіть IBAN"
          maxLength={34}
          className={s.formInput}
          disabled={!editable}
        />
      </Form.Item>
      <Form.Item name="MFO" label="МФО" rules={validateField('required')}>
        <Input
          placeholder="Вкажіть МФО"
          maxLength={256}
          className={s.formInput}
          disabled={!editable}
        />
      </Form.Item>
      <Form.Item name="description" label="Опис">
        <Input.TextArea
          placeholder="Вкажіть значення"
          className={s.formInput}
          maxLength={512}
          rows={4}
          disabled={!editable}
        />
      </Form.Item>

      <Form.Item name="PRIVATE_TOKEN" label="Private Token">
        <Input
          placeholder="Token"
          className={s.formInput}
          disabled={!editable}
        />
      </Form.Item>
    </Form>
  )
}

export default DomainForm
