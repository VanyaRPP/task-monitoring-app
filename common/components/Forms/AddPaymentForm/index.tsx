import React, { FC, useEffect, useState } from 'react'
import { useGetAllUsersQuery } from '@common/api/userApi/user.api'
import { validateField } from '@common/assets/features/validators'
import { Form, FormInstance, Input, InputNumber, Select } from 'antd'
import PaymentModalTable from '@common/components/PaymentModalTable'
import { useRouter } from 'next/router'
import s from './style.module.scss'

interface Props {
  form: FormInstance<any>
  paymentData: any
  edit: boolean
  users?: any
}

const AddPaymentForm: FC<Props> = ({ form, paymentData, edit }) => {
  const { Option } = Select
  const { data: users } = useGetAllUsersQuery()
  const [total, setTotal] = useState(0)
  const router = useRouter()
  const {
    query: { email },
  } = router

  const maintenance = Form.useWatch('maintenance', form)
  const placing = Form.useWatch('placing', form)
  const electricity = Form.useWatch('electricity', form)
  const water = Form.useWatch('water', form)

  useEffect(() => {
    setTotal(
      maintenance?.sum + placing?.sum + electricity?.sum + water?.sum || 0
    )
    form.setFieldValue('debit', total)
  }, [maintenance, placing, electricity, water, form, total])

  useEffect(() => {
    if (email) {
      const foundUser = users?.find((itm) => itm.email === email)
      if (foundUser?._id) {
        form.setFieldValue('payer', foundUser?._id)
      }
    }
  }, [email, users.length, form, users])

  return (
    <Form
      initialValues={{
        description: paymentData?.description,
        credit: paymentData?.credit,
        debit: paymentData?.debit,
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
          showSearch
          filterOption={(input, option) =>
            (option?.label || '').includes(input)
          }
          options={users?.map((user) => ({
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
        className={s.priceItem}
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
                  className={s.inputNumber}
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
            <>
              <PaymentModalTable form={form} />
              <Form.Item name="debit">
                <div className={s.totalItem}>
                  <p>Сума:</p>
                  <p>{total.toFixed(2)} ₴</p>
                </div>
              </Form.Item>
            </>
          )
        }
      </Form.Item>
    </Form>
  )
}

export default AddPaymentForm
