import { validateField } from '@assets/features/validators'
import EmailSelect from '@components/UI/Reusable/EmailSelect'
import { Form, FormInstance, Input } from 'antd'
import { FC, useEffect, useState } from 'react'
import DomainStreets from './DomainStreets'
import s from './style.module.scss'
import { useSession } from 'next-auth/react'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'

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
  const { data: session } = useSession()
  const { data: user } = useGetCurrentUserQuery()
  const [initialValue, setInitial] = useState<{ [key: string]: any }>({
    adminEmails: [],
  })
  useEffect(() => {
    if(session?.user.email && user.roles.includes("DomainAdmin")){
      setInitial({
        adminEmails: [session?.user.email],
      })
    }
  }, [form])
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
      <EmailSelect form={form} disabled={!editable} initialValue={initialValue.adminEmails}/>
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
