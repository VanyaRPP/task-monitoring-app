import { useState } from 'react'
import { validateField } from '@assets/features/validators'
import EmailSelect from '@components/UI/Reusable/EmailSelect'
import { Form, FormInstance, Input, Select } from 'antd'
import DomainStreets from './DomainStreets'
import s from './style.module.scss'
import DomainInfo from './DomainInfo'
import DomainsServices from './DomainsServices'
import ServicesSelect from '@components/UI/Reusable/ServicesSelect'

const TEMPLATE_OPTIONS = [
  { value: 'classic', label: 'Класичний шаблон' },
  { value: 'olimp',   label: 'OLIMP DIGITAL OÜ' },
  { value: 'ledger',  label: 'Formal Ledger' },
]

interface Props {
  form: FormInstance<any>
  editable?: boolean
  setIsValueChanged: (value: boolean) => void
  domainId?: string
}

const DomainForm: React.FC<Props> = ({
  form,
  editable = true,
  setIsValueChanged,
  domainId,
}) => {
  const [customServices, setCustomServices] = useState<
    { _id: string; name: string }[]
  >([])

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
      <ServicesSelect form={form} disabled={!editable} domainId={domainId} />
      <DomainsServices
        form={form}
        editable={editable}
        onCustomServicesChange={setCustomServices}
        domainId={domainId}
      />
      <DomainInfo editable={editable} form={form} />
      <Form.Item name="defaultTemplate" label="Шаблон за замовчуванням">
        <Select
          options={TEMPLATE_OPTIONS}
          placeholder="Класичний шаблон"
          disabled={!editable}
          allowClear
        />
      </Form.Item>
    </Form>
  )
}

export default DomainForm
