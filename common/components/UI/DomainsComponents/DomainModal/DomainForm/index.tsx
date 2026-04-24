import { validateField } from '@assets/features/validators'
import EmailSelect from '@components/UI/Reusable/EmailSelect'
import { Form, FormInstance, Input } from 'antd'
import DomainStreets from './DomainStreets'
import s from './style.module.scss'
import DomainInfo from './DomainInfo'
import DomainsServices from './DomainsServices'
import ServicesSelect from '@components/UI/Reusable/ServicesSelect'

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
      <DomainsServices form={form} editable={editable} domainId={domainId} />
      <DomainInfo editable={editable} form={form} />
    </Form>
  )
}

export default DomainForm
