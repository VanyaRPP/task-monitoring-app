import React, { FC } from 'react'
import { validateField } from '@common/assets/features/validators'
import { Select, Form, FormInstance, Input, InputNumber, Checkbox } from 'antd'
import AddressesSelect from '../../../Reusable/AddressesSelect'
import DomainsSelect from '../../../Reusable/DomainsSelect'
import s from './style.module.scss'
import EmailSelect from '@common/components/UI/Reusable/EmailSelect'
import { IExtendedRealestate } from '@common/api/realestateApi/realestate.api.types'

interface Props {
  form: FormInstance<any>
  currentRealEstate?: IExtendedRealestate
  editable?: boolean
  disabled?: boolean
}

const RealEstateForm: FC<Props> = ({
  form,
  currentRealEstate,
  editable = true,
  disabled = false,
}) => {
  const companyNameValue = Form.useWatch('companyName', form)
  const descriptionValue = Form.useWatch('description', form)

  return (
    <Form form={form} layout="vertical" className={s.Form}>
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
        {editable ? (
          <Input placeholder="Опис" maxLength={256} className={s.formInput} />
        ) : (
          <div>{companyNameValue}</div>
        )}
      </Form.Item>
      <Form.Item
        name="description"
        label="Опис"
        rules={editable && validateField('required')}
      >
        {editable ? (
          <Input.TextArea
            rows={4}
            placeholder="Опис"
            maxLength={512}
            className={s.formInput}
          />
        ) : (
          <div>{descriptionValue}</div>
        )}
      </Form.Item>
      <EmailSelect form={form} disabled={!editable} />
      <Form.Item
        name="totalArea"
        label="Площа (м²)"
        rules={editable && validateField('required')}
      >
        {editable ? (
          <InputNumber placeholder="Вкажіть значення" className={s.formInput} />
        ) : (
          <div>{form.getFieldValue('totalArea')}</div>
        )}
      </Form.Item>
      <Form.Item
        name="pricePerMeter"
        label="Ціна (грн/м²)"
        rules={editable && validateField('required')}
      >
        {editable ? (
          <InputNumber placeholder="Вкажіть значення" className={s.formInput} />
        ) : (
          <div>{form.getFieldValue('pricePerMeter')}</div>
        )}
      </Form.Item>
      <Form.Item
        name="servicePricePerMeter"
        label="Індивідуальне утримання (грн/м²)"
      >
        {editable ? (
          <InputNumber placeholder="Вкажіть значення" className={s.formInput} />
        ) : (
          <div>{form.getFieldValue('servicePricePerMeter')}</div>
        )}
      </Form.Item>
      <Form.Item name="rentPart" label="Частка загальної площі">
        {editable ? (
          <InputNumber placeholder="Вкажіть значення" className={s.formInput} />
        ) : (
          <div>{form.getFieldValue('rentPart')}</div>
        )}
      </Form.Item>
      <Form.Item name="waterPart" label="Частка водопостачання">
        {editable ? (
          <InputNumber placeholder="Вкажіть значення" className={s.formInput} />
        ) : (
          <div>{form.getFieldValue('waterPart')}</div>
        )}
      </Form.Item>
      <Form.Item name="cleaning" label="Прибирання (грн)">
        {editable ? (
          <InputNumber placeholder="Вкажіть значення" className={s.formInput} />
        ) : (
          <div>{form.getFieldValue('cleaning')}</div>
        )}
      </Form.Item>
      <Form.Item name="discount" label="Знижка">
        {editable ? (
          <InputNumber placeholder="Вкажіть значення" className={s.formInput} />
        ) : (
          <div>{form.getFieldValue('discount')}</div>
        )}
      </Form.Item>
      <Form.Item
        valuePropName="checked"
        name="garbageCollector"
        label="Вивіз сміття"
      >
        {editable ? (
          <Checkbox />
        ) : (
          <div>{form.getFieldValue('garbageCollector') ? 'Так' : 'Ні'}</div>
        )}
      </Form.Item>
      <Form.Item
        valuePropName="checked"
        name="inflicion"
        label="Індекс інфляції"
      >
        {editable ? (
          <Checkbox />
        ) : (
          <div>{form.getFieldValue('inflicion') ? 'Так' : 'Ні'}</div>
        )}
      </Form.Item>
    </Form>
  )
}

export default RealEstateForm
