import React, { FC } from 'react'
import { validateField } from '@common/assets/features/validators'
import { Select, Form, FormInstance, Input, InputNumber, Checkbox } from 'antd'
import AddressesSelect from '../../../Reusable/AddressesSelect'
import DomainsSelect from '../../../Reusable/DomainsSelect'
import s from './style.module.scss'
import EmailSelect from '@common/components/UI/Reusable/EmailSelect'

interface Props {
  form: FormInstance<any>
}

const RealEstateForm: FC<Props> = ({ form }) => {
  return (
    <Form form={form} layout="vertical" className={s.Form}>
      <DomainsSelect form={form} />
      <AddressesSelect form={form} />
      <Form.Item
        name="companyName"
        label="Назва компанії"
        rules={validateField('required')}
      >
        <Input placeholder="Опис" maxLength={256} className={s.formInput} />
      </Form.Item>
      <Form.Item
        name="description"
        label="Опис"
        rules={validateField('required')}
      >
        <Input.TextArea rows={4} placeholder="Опис" maxLength={512} className={s.formInput} />
      </Form.Item>
      <EmailSelect form={form} />
      <Form.Item
        name="totalArea"
        label="Кількість метрів"
        rules={validateField('required')}
      >
        <InputNumber placeholder="Вкажіть значення" className={s.formInput} />
      </Form.Item>
      <Form.Item
        name="pricePerMeter"
        label="Ціна за метр"
        rules={validateField('required')}
      >
        <InputNumber placeholder="Вкажіть значення" className={s.formInput} />
      </Form.Item>
      <Form.Item name="garbageCollector" label="Вивіз сміття">
        <InputNumber placeholder="Вкажіть значення" className={s.formInput} />
      </Form.Item>
      <Form.Item
        name="servicePricePerMeter"
        label="Індивідуальне утримання за метр"
      >
        <InputNumber placeholder="Вкажіть значення" className={s.formInput} />
      </Form.Item>
      <Form.Item name="rentPart" label="Частка загальної площі">
        <InputNumber placeholder="Вкажіть значення" className={s.formInput} />
      </Form.Item>
      <Form.Item name="waterPart" label="Частка водопостачання">
        <InputNumber placeholder="Вкажіть значення" className={s.formInput} />
      </Form.Item>
      <Form.Item valuePropName="checked" name="inflicion" label="Індекс інфляції">
        <Checkbox />
      </Form.Item>
    </Form>
  )
}

export default RealEstateForm
