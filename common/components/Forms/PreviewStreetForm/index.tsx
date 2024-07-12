import React, { FC } from 'react'
import { Form, FormInstance, Input } from 'antd'
import s from './style.module.scss'
import { IStreet } from '@common/api/streetApi/street.api.types'
import useInitialStreetValues from '@common/modules/hooks/useInitialStreetValues'

interface Props {
  form: FormInstance<any>
  currentStreet: IStreet
}

const PreviewStreetForm: FC<Props> = ({ form, currentStreet }) => {
  const initialValues = useInitialStreetValues(currentStreet)

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
