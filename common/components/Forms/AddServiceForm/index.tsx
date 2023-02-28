import React, { FC } from 'react'
import {
  useGetAllUsersQuery,
  useGetUserByEmailQuery,
} from '@common/api/userApi/user.api'
import { validateField } from '@common/assets/features/validators'
import { Form, FormInstance, Input, InputNumber, Select } from 'antd'
import { useSession } from 'next-auth/react'
import { Roles } from '@utils/constants'
import s from './style.module.scss'
import type { DatePickerProps } from 'antd'
import { DatePicker, Space } from 'antd'

const onChange: DatePickerProps['onChange'] = (date, dateString) => {
  // console.warn(date, dateString)
}

interface Props {
  form: FormInstance<any>
}

const AddServiceForm: FC<Props> = ({ form }) => {
  const { Option } = Select
  const { data: users } = useGetAllUsersQuery('')
  const dayjs = require('dayjs')
  // const { TODO: If we use both forms uncomment
  //   data: {
  //     user: { email, name },
  //   },
  // } = useSession()
  // const userResponse = useGetUserByEmailQuery(email)
  // const userRole = userResponse?.data?.data?.role
  // const handlePaymentType = () => {
  //   switch (userRole) {
  //     case Roles.ADMIN:
  //       return (
  //         <>
  //           <Form.Item
  //             name="operation"
  //             label="Тип оплати"
  //             rules={validateField('required')}
  //           >
  //             <Select placeholder="Оберіть тип оплати" className={s.Select}>
  //               <Option value="credit">Кредит (Оплата)</Option>
  //               <Option value="debit">Дебет (Реалізація)</Option>
  //             </Select>
  //           </Form.Item>
  //           <Form.Item
  //             shouldUpdate={(prevValues, currentValues) =>
  //               prevValues.operation !== currentValues.operation
  //             }
  //           >
  //             {({ getFieldValue }) =>
  //               getFieldValue('operation') === 'credit' ? (
  //                 <Form.Item
  //                   name="credit"
  //                   label="Сума"
  //                   rules={validateField('paymentPrice')}
  //                 >
  //                   <InputNumber className={s.InputNumber} />
  //                 </Form.Item>
  //               ) : (
  //                 <Form.Item
  //                   name="debit"
  //                   label="Сума"
  //                   rules={validateField('paymentPrice')}
  //                 >
  //                   <InputNumber className={s.InputNumber} />
  //                 </Form.Item>
  //               )
  //             }
  //           </Form.Item>
  //         </>
  //       )
  //     case Roles.USER || Roles.WORKER:
  //       return (
  //         <Form.Item
  //           name="credit"
  //           label={`Оплата від ${name}`}
  //           rules={validateField('paymentPrice')}
  //         >
  //           <InputNumber className={s.InputNumber} />
  //         </Form.Item>
  //       )
  //   }
  // }
  return (
    <Form form={form} layout="vertical" className={s.Form}>
      <Form.Item
        name="payer"
        label="Місяць та рік"
        rules={validateField('required')}
      >
        {/* <Select
          placeholder="Оберіть платника"
          style={{ width: '100%' }}
          options={users?.data.map((user) => ({
            key: user._id,
            label: user.email,
            value: user._id,
          }))}
        /> */}
        <Space direction="vertical">
          <DatePicker onChange={onChange} defaultValue={dayjs} picker="month" />
        </Space>
      </Form.Item>
      {/* {handlePaymentType()} */}
      <Form.Item
        name="operation"
        label="Утримання приміщень"
        rules={validateField('required')}
      >
        <Select placeholder="Оберіть тип оплати" className={s.Select}>
          <Option value="credit">Кредит (Оплата)</Option>
          <Option value="debit">Дебет (Реалізація)</Option>
        </Select>
      </Form.Item>
      <Form.Item
        shouldUpdate={(prevValues, currentValues) =>
          prevValues.operation !== currentValues.operation
        }
      >
        <Form.Item
          name="credit"
          label="Сума"
          rules={validateField('paymentPrice')}
        >
          <InputNumber className={s.InputNumber} />
        </Form.Item>
      </Form.Item>
      <Form.Item
        name="description"
        label="Водопостачання"
        rules={validateField('required')}
      >
        <InputNumber placeholder="Водопостачання" className={s.InputNumber} />
      </Form.Item>
      <Form.Item
        name="description"
        label="Індекс інфляції"
        rules={validateField('required')}
      >
        <InputNumber placeholder="Індекс інфляції" className={s.InputNumber} />
      </Form.Item>

      <Form.Item
        name="description"
        label="Опис"
        rules={validateField('required')}
      >
        <Input.TextArea placeholder="Введіть опис" maxLength={256} />
      </Form.Item>
    </Form>
  )
}

export default AddServiceForm
