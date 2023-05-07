import React, { FC } from 'react'
import { validateField } from '@common/assets/features/validators'
import { Form, FormInstance, Input, InputNumber } from 'antd'
import { DatePicker } from 'antd'
import s from './style.module.scss'

interface Props {
  form: FormInstance<any>
}

const RealEstateForm: FC<Props> = ({ form }) => {
  return (
    <Form form={form} layout="vertical" className={s.Form}>
      <Form.Item name="address" label="Адреса" rules={validateField('address')}>
        <Input placeholder="Опис" maxLength={256} className={s.formInput} />
      </Form.Item>
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
        {/* TODO: select */}
        <Input placeholder="Опис" maxLength={256} className={s.formInput} />
      </Form.Item>
      <Form.Item
        name="totalArea"
        label="Кількість метрів"
        rules={validateField('totalArea')}
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
      <Form.Item
        name="servicePricePerMeter"
        label="Індивідуальне утримання за метр"
        // rules={validateField('required')}
      >
        <InputNumber placeholder="Вкажіть значення" className={s.formInput} />
      </Form.Item>
      <Form.Item
        name="garbageCollector"
        label="Вивіз сміття"
        // rules={validateField('required')}
      >
        <InputNumber placeholder="Вкажіть значення" className={s.formInput} />
      </Form.Item>
    </Form>
  )
}

export default RealEstateForm
