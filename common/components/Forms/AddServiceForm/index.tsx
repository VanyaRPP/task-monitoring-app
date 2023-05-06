import React, { FC, useState } from 'react'
import { validateField } from '@common/assets/features/validators'
import { Form, FormInstance, Input, InputNumber, Select } from 'antd'
import { DatePicker } from 'antd'
import s from './style.module.scss'

interface Props {
  form: FormInstance<any>
}

const AddServiceForm: FC<Props> = ({ form }) => {
  const { MonthPicker } = DatePicker

  return (
    <Form form={form} layout="vertical" className={s.Form}>
      <Form.Item
        name="date"
        label="Місяць та рік"
        rules={validateField('date')}
      >
        <MonthPicker
          format="MMMM YYYY"
          placeholder="Оберіть місяць"
          className={s.formInput}
        />
      </Form.Item>
      <Form.Item name="address" label="Адреса" rules={validateField('address')}>
        <Input
          placeholder="Введіть адресу"
          maxLength={256}
          className={s.formInput}
        />
      </Form.Item>
      <Form.Item
        name="rentPrice"
        label="Утримання приміщень"
        rules={validateField('required')}
      >
        <InputNumber placeholder="Вкажіть значення" className={s.formInput} />
      </Form.Item>
      <Form.Item
        name="electricityPrice"
        label="Електроенергія"
        rules={validateField('electricityPrice')}
      >
        <InputNumber placeholder="Вкажіть значення" className={s.formInput} />
      </Form.Item>
      <Form.Item
        name="waterPrice"
        label="Водопостачання"
        rules={validateField('required')}
      >
        <InputNumber placeholder="Вкажіть значення" className={s.formInput} />
      </Form.Item>
      <Form.Item
        name="inflicionPrice"
        label="Індекс інфляції"
        rules={validateField('required')}
      >
        <InputNumber placeholder="Вкажіть значення" className={s.formInput} />
      </Form.Item>
      <Form.Item
        name="description"
        label="Опис"
        rules={validateField('required')}
      >
        <Input.TextArea
          placeholder="Введіть опис"
          maxLength={256}
          className={s.formInput}
        />
      </Form.Item>
    </Form>
  )
}

export default AddServiceForm
