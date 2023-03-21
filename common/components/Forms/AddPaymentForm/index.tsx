import React, { FC, useEffect, useState } from 'react'
import { useGetAllUsersQuery } from '@common/api/userApi/user.api'
import { validateField } from '@common/assets/features/validators'
import { Form, FormInstance, Input, InputNumber, Select } from 'antd'
import PaymentModalTable from '@common/components/PaymentModalTable'
import s from './style.module.scss'

interface Props {
  form: FormInstance<any>
}

const AddPaymentForm: FC<Props> = ({ form, paymentData, edit }) => {
  const { Option } = Select
  const { data: users } = useGetAllUsersQuery('')
  // console.log(paymentData)
  return (
    <Form
      initialValues={{
        description: paymentData?.description,
        credit: paymentData?.credit,
        payer: paymentData?.payer?._id,
      }}
      form={form}
      layout="vertical"
      className={s.Form}
    >
      <Form.Item name="payer" label="Платник" rules={validateField('required')}>
        <Select
          disabled={edit && true}
          placeholder="Оберіть платника"
          style={{ width: '100%' }}
          options={users?.data.map((user) => ({
            key: user._id,
            label: user.email,
            value: user._id,
          }))}
        />
      </Form.Item>
      <Form.Item
        name="operation"
        label="Тип оплати"
        initialValue="credit"
        rules={validateField('required')}
      >
        <Select
          placeholder="Оберіть тип оплати"
          className={s.Select}
          disabled={edit && true}
        >
          <Option value="credit">Кредит (Оплата)</Option>
          <Option value="debit">Дебет (Реалізація)</Option>
        </Select>
      </Form.Item>
      <Form.Item
        shouldUpdate={(prevValues, currentValues) =>
          prevValues.operation !== currentValues.operation
        }
        className={s.PriceItem}
      >
        {({ getFieldValue }) =>
          getFieldValue('operation') === 'credit' ? (
            <>
              <Form.Item
                name="credit"
                label="Сума"
                rules={validateField('paymentPrice')}
              >
                <InputNumber
                  className={s.InputNumber}
                  disabled={edit && true}
                />
              </Form.Item>
              <Form.Item
                name="description"
                label="Опис"
                rules={validateField('required')}
              >
                <Input.TextArea
                  placeholder="Введіть опис"
                  maxLength={256}
                  disabled={edit && true}
                />
              </Form.Item>
            </>
          ) : (
            <PaymentModalTable form={form} />
          )
        }
      </Form.Item>
    </Form>
  )
}

export default AddPaymentForm
