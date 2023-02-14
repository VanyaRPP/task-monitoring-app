import React, { FC } from 'react'
import { useGetUserByEmailQuery } from '@common/api/userApi/user.api'
import { validateField } from '@common/assets/features/validators'
import {
  DatePicker,
  Form,
  FormInstance,
  Input,
  InputNumber,
  Select,
} from 'antd'
import { useSession } from 'next-auth/react'
import { Roles } from '@utils/constants'
import s from './style.module.scss'

interface Props {
  form: FormInstance<any>
}

const AddPaymentForm: FC<Props> = ({ form }) => {
  const { Option } = Select
  const {
    data: {
      user: { email, name },
    },
  } = useSession()

  const userResponse = useGetUserByEmailQuery(email)
  const userRole = userResponse?.data?.data?.role

  const handlePaymentType = () => {
    switch (userRole) {
      case Roles.ADMIN:
        return (
          <>
            <Form.Item
              name="operation"
              label="Рахунок"
              rules={validateField('required')}
            >
              <Select placeholder="Оберіть тип рахунку" className={s.Select}>
                <Option value="credit">Кредит (Оплата)</Option>
                <Option value="debit">Дебет (Реалізація)</Option>
              </Select>
            </Form.Item>
            <Form.Item
              shouldUpdate={(prevValues, currentValues) =>
                prevValues.operation !== currentValues.operation
              }
            >
              {({ getFieldValue }) =>
                getFieldValue('operation') === 'credit' ? (
                  <Form.Item
                    name="credit"
                    label="Сума"
                    rules={validateField('required')}
                  >
                    <InputNumber className={s.InputNumber} />
                  </Form.Item>
                ) : (
                  <Form.Item
                    name="debit"
                    label="Сума"
                    rules={validateField('required')}
                  >
                    <InputNumber className={s.InputNumber} />
                  </Form.Item>
                )
              }
            </Form.Item>
          </>
        )
      case Roles.USER || Roles.WORKER:
        return (
          <Form.Item
            name="credit"
            label={`Рахунок від ${name}`}
            rules={validateField('required')}
          >
            <InputNumber className={s.InputNumber} />
          </Form.Item>
        )
    }
  }

  return (
    <Form form={form} layout="vertical" className={s.Form}>
      <Form.Item name="date" label="Дата" rules={validateField('required')}>
        <DatePicker placeholder="Оберіть дату" className={s.DatePicker} />
      </Form.Item>
      {handlePaymentType()}
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
