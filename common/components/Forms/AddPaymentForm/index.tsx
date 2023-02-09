import { useGetUserByEmailQuery } from '@common/api/userApi/user.api'
import { validateField } from '@common/assets/features/validators'
import { DatePicker, Form, FormInstance, Input, Modal } from 'antd'
import { Moment } from 'moment'
import { useSession } from 'next-auth/react'
import React, { FC } from 'react'

interface Props {
  form: FormInstance<any>
}

const AddPaymentForm: FC<Props> = ({ form }) => {
  const session = useSession()
  const userResponse = useGetUserByEmailQuery(session?.data?.user?.email)
  const userRole = userResponse?.data?.data?.role

  return (
    <Form form={form} layout="vertical">
      <Form.Item name="date" label="Дата" rules={validateField('required')}>
        <DatePicker placeholder="Оберіть дату" style={{ width: '100%' }} />
      </Form.Item>
      {userRole === 'Admin' && (
        <Form.Item
          name="debit"
          label="Дебет(Реалізація)"
          rules={validateField('required')}
        >
          <Input />
        </Form.Item>
      )}
      <Form.Item
        name="credit"
        label="Кредит(Оплата)"
        rules={validateField('required')}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="description"
        label="Опис"
        rules={validateField('required')}
      >
        <Input.TextArea maxLength={256} />
      </Form.Item>
    </Form>
  )
}

export default AddPaymentForm
