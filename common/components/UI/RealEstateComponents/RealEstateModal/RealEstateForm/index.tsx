import { validateField } from '@assets/features/validators'
import { IExtendedRealestate } from '@common/api/realestateApi/realestate.api.types'
import EmailSelect from '@components/UI/Reusable/EmailSelect'
import { Checkbox, Form, FormInstance, Input, InputNumber } from 'antd'
import { FC,useEffect, useState } from 'react'
import AddressesSelect from '../../../Reusable/AddressesSelect'
import DomainsSelect from '../../../Reusable/DomainsSelect'
import s from './style.module.scss'
import { useSession } from 'next-auth/react'

interface Props {
  form: FormInstance<any>
  currentRealEstate?: IExtendedRealestate
  editable?: boolean
  setIsValueChanged: (value: boolean) => void
}

const RealEstateForm: FC<Props> = ({
  form,
  currentRealEstate,
  editable = true,
  setIsValueChanged,
}) => {
  const { data: session } = useSession()
  const [initialValue, setInitial] = useState<{ [key: string]: any }>({
    adminEmails: [],
  })
  useEffect(() => {
    if(session?.user.email){
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
      {currentRealEstate ? (
        <Form.Item name="domain" label="Надавач послуг">
          <Input disabled />
        </Form.Item>
      ) : (
        <DomainsSelect form={form} />
      )}
      {currentRealEstate ? (
        <Form.Item name="street" label="Адреса">
          <Input disabled />
        </Form.Item>
      ) : (
        <AddressesSelect form={form} />
      )}
      <Form.Item
        name="companyName"
        label="Назва компанії"
        rules={validateField('required')}
      >
        <Input
          placeholder="Назва компанії"
          maxLength={256}
          className={s.formInput}
          disabled={!editable}
        />
      </Form.Item>
      <Form.Item
        name="description"
        label="Опис"
        rules={validateField('required')}
      >
        <Input.TextArea
          rows={4}
          placeholder="Опис"
          maxLength={512}
          className={s.formInput}
          disabled={!editable}
        />
      </Form.Item>
      <EmailSelect form={form} disabled={!editable} initialValue={initialValue.adminEmails}/>
      <Form.Item
        name="totalArea"
        label="Площа (м²)"
        rules={validateField('required')}
      >
        <InputNumber
          placeholder="Вкажіть значення"
          className={s.formInput}
          disabled={!editable}
        />
      </Form.Item>
      <Form.Item
        name="pricePerMeter"
        label="Ціна (грн/м²)"
        rules={validateField('required')}
      >
        <InputNumber
          placeholder="Вкажіть значення"
          className={s.formInput}
          disabled={!editable}
        />
      </Form.Item>
      <Form.Item
        name="servicePricePerMeter"
        label="Індивідуальне утримання (грн/м²)"
      >
        <InputNumber
          placeholder="Вкажіть значення"
          className={s.formInput}
          disabled={!editable}
        />
      </Form.Item>
      <Form.Item name="rentPart" label="Частка загальної площі">
        <InputNumber
          placeholder="Вкажіть значення"
          className={s.formInput}
          disabled={!editable}
        />
      </Form.Item>
      <Form.Item name="waterPart" label="Частка водопостачання">
        <InputNumber
          placeholder="Вкажіть значення"
          className={s.formInput}
          disabled={!editable}
        />
      </Form.Item>
      <Form.Item name="cleaning" label="Прибирання (грн)">
        <InputNumber
          placeholder="Вкажіть значення"
          className={s.formInput}
          disabled={!editable}
        />
      </Form.Item>
      <Form.Item name="discount" label="Знижка">
        <InputNumber
          placeholder="Вкажіть значення"
          className={s.formInput}
          disabled={!editable}
        />
      </Form.Item>
      <Form.Item
        valuePropName="checked"
        name="garbageCollector"
        label="Вивіз сміття"
      >
        <Checkbox disabled={!editable} />
      </Form.Item>
      <Form.Item
        valuePropName="checked"
        name="inflicion"
        label="Індекс інфляції"
      >
        <Checkbox disabled={!editable} />
      </Form.Item>
    </Form>
  )
}

export default RealEstateForm
