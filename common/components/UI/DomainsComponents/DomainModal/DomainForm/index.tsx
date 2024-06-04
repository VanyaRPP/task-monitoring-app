import { validateField } from '@common/assets/features/validators'
import EmailSelect from '@common/components/UI/Reusable/EmailSelect'
import { IDomain } from '@common/modules/models/Domain'
import { Form, FormInstance, Input } from 'antd'
import { FC } from 'react'
import DomainStreets from './DomainStreets'
import s from './style.module.scss'

interface Props {
  form: FormInstance<any>
  currentDomain: IDomain
}
const DomainForm: FC<Props> = ({ form, currentDomain }) => {
  const initialValues = useInitialValues(currentDomain)
  return (
    <Form
      form={form}
      layout="vertical"
      className={s.Form}
      initialValues={initialValues}
    >
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

function useInitialValues(currentDomain: IDomain) {
  // TODO: add useEffect || useCallback ?
  // currently we have few renders
  // we need it only once. on didmount (first render)
  const initialValues = {
    name: currentDomain?.name,
    adminEmails: currentDomain?.adminEmails,
    streets: currentDomain?.streets.map((i: any) => ({
      value: i._id,
      label: `${i.address} (м. ${i.city})`,
    })),
    description: currentDomain?.description,
  }
  return initialValues
}

export default DomainForm
