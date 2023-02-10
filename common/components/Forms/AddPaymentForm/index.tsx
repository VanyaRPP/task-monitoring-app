import React, { FC, useState } from 'react'
import { useGetUserByEmailQuery } from '@common/api/userApi/user.api'
import { validateField } from '@common/assets/features/validators'
import { DatePicker, Form, FormInstance, Input, Select } from 'antd'
import { useSession } from 'next-auth/react'
import { Roles } from '@utils/constants'
import { useGetAllPaymentsQuery } from '@common/api/paymentApi/payment.api'
import s from './style.module.scss'

interface Props {
  form: FormInstance<any>
}

const AddPaymentForm: FC<Props> = ({ form }) => {
  const session = useSession()
  const userResponse = useGetUserByEmailQuery(session?.data?.user?.email)
  const userRole = userResponse?.data?.data?.role
  const [paymentType, setPaymentType] = useState<string>()

  const handleChange = (value: string) => {
    setPaymentType(value)
  }

  const handlePaymentType = () => {
    switch (paymentType) {
      case 'debit':
        return (
          <Form.Item
            name="debit"
            label="Дебет(Реалізація)"
            rules={validateField('required')}
          >
            <Input />
          </Form.Item>
        )
      case 'credit':
        return (
          <Form.Item
            name="credit"
            label="Кредит(Оплата)"
            rules={validateField('required')}
          >
            <Input />
          </Form.Item>
        )
    }
  }

  return (
    <Form form={form} layout="vertical" className={s.Form}>
      <Form.Item name="date" label="Дата" rules={validateField('required')}>
        <DatePicker placeholder="Оберіть дату" className={s.DatePicker} />
      </Form.Item>
      {userRole === Roles.ADMIN ? (
        <>
          <div className={s.SelectBlock}>
            <p>Кредит/Дебет</p>
            <Select
              placeholder="Оберіть кредит/дебет"
              onChange={handleChange}
              options={[
                { value: 'credit', label: 'Кредит(Оплата)' },
                { value: 'debit', label: 'Дебет(Реалізація)' },
              ]}
              className={s.Select}
            />
          </div>
          {handlePaymentType()}
        </>
      ) : (
        <Form.Item
          name="credit"
          label="Кредит(Оплата)"
          rules={validateField('required')}
        >
          <Input />
        </Form.Item>
      )}
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
