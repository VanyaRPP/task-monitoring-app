import React, { FC } from 'react'
import { validateField } from '@common/assets/features/validators'
import { Form, FormInstance, Input, Select } from 'antd'
import s from './style.module.scss'
import EmailSelect from '@common/components/UI/Reusable/EmailSelect'
import { IExtendedDomain } from '@common/api/domainApi/domain.api.types'
import { IStreet } from '@common/modules/models/Street'
import { FormStreetSelect } from '@common/components/UI/Selects/StreetSelect'

interface Props {
  form: FormInstance<any>
  currentDomain: IExtendedDomain
}
const DomainForm: FC<Props> = ({ form, currentDomain }) => {
  const initialValues = useInitialValues(currentDomain)
  return (
    <Form form={form} layout="vertical" className={s.Form} initialValues={initialValues}>
      <Form.Item name="name" label="Назва" rules={validateField('description')}>
        <Input placeholder="Вкажіть значення" maxLength={256} className={s.formInput} />
      </Form.Item>
      <EmailSelect form={form} />
      <FormStreetSelect form={form} selectProps={{ multiple: true }} />
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

function useInitialValues(currentDomain: IExtendedDomain) {
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
