import { IExtendedDomain } from '@common/api/domainApi/domain.api.types'
import { validateField } from '@common/assets/features/validators'
import EmailSelect from '@common/components/UI/Reusable/EmailSelect'
import { FormStreetSelect } from '@common/components/UI/Selects/StreetSelect'
import { Form, FormInstance, Input } from 'antd'
import { useMemo } from 'react'
import s from './style.module.scss'

interface DomainFormProps {
  form: FormInstance
  currentDomain: IExtendedDomain
}
const DomainForm: React.FC<DomainFormProps> = ({ form, currentDomain }) => {
  const initialValues = useInitialValues(currentDomain)

  return (
    <Form form={form} layout="vertical" className={s.Form} initialValues={initialValues}>
      <Form.Item name="name" label="Назва" rules={validateField('description')}>
        <Input placeholder="Вкажіть значення" maxLength={256} className={s.formInput} />
      </Form.Item>
      <EmailSelect form={form} />
      <FormStreetSelect mode="multiple" />
      <Form.Item name="description" label="Опис" rules={validateField('required')}>
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

const useInitialValues = (currentDomain: IExtendedDomain) =>
  useMemo(() => {
    return {
      name: currentDomain?.name,
      adminEmails: currentDomain?.adminEmails,
      streets: currentDomain?.streets.map(({ _id }) => _id),
      description: currentDomain?.description,
    }
  }, [currentDomain])

export default DomainForm
