import React, { FC } from 'react'
import { validateField } from '@common/assets/features/validators'
import { Select, Form, FormInstance, Input, InputNumber } from 'antd'
import EstateAddresses from './EstateAddresses'
import s from './style.module.scss'

interface Props {
  form: FormInstance<any>
}

const RealEstateForm: FC<Props> = ({ form }) => {
  return (
    <Form form={form} layout="vertical" className={s.Form}>
      <EstateAddresses />
      <Form.Item
        name="description"
        label="Назва компанії"
        rules={validateField('description')}
      >
        <Input placeholder="Опис" maxLength={256} className={s.formInput} />
      </Form.Item>
      <Form.Item
        name="adminEmails"
        label="Адміністратори"
        rules={validateField('required')}
      >
        <Select mode="tags" placeholder="Пошти адмінів компанії" />
      </Form.Item>
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
      <Form.Item name="payer" label="Платник" rules={validateField('required')}>
        <Input.TextArea
          placeholder="Одержувач рахунку"
          className={s.formInput}
        />
      </Form.Item>
      <Form.Item
        name="servicePricePerMeter"
        label="Індивідуальне утримання за метр"
      >
        <InputNumber placeholder="Вкажіть значення" className={s.formInput} />
      </Form.Item>
      <Form.Item name="garbageCollector" label="Вивіз сміття">
        <InputNumber placeholder="Вкажіть значення" className={s.formInput} />
      </Form.Item>
    </Form>
  )
}

export default RealEstateForm
