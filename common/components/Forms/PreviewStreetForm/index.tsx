import React, { FC } from 'react'
import { Form, FormInstance, Input } from 'antd'
import s from './style.module.scss'
import useInitialStreetValues from '@common/modules/hooks/useInitialStreetValues'

interface Props {
  form: FormInstance<any>
  city: string
  address: string
}

const PreviewStreetForm: FC<Props> = ({ form, city, address }) => {
  const initialValues = useInitialStreetValues(city, address)

  return (
    <Form
      initialValues={initialValues}
      form={form}
      layout="vertical"
      className={s.Form}
    >
      <Form.Item name="city" label="Місто">
        <Input disabled />
      </Form.Item>
      <Form.Item name="address" label="Адреса">
        <Input disabled />
      </Form.Item>
    </Form>
  )
}

export default PreviewStreetForm
