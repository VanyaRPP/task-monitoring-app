import React, { FC, useState } from 'react'
import { validateField } from '@common/assets/features/validators'
import { Form, FormInstance, Input, InputNumber, Select } from 'antd'
import s from './style.module.scss'
import { Operations } from '@utils/constants'
import AddressesSelect from '@common/components/UI/Reusable/AddressesSelect'
import DomainsSelect from '@common/components/UI/Reusable/DomainsSelect'
import CompanySelect from './CompanySelect'
import PaymentTotal from './PaymentTotal'
import PaymentPricesTable from './PaymentPricesTable'
import MonthServiceSelect from './MonthServiceSelect'
import Operation from 'antd/lib/transfer/operation'

interface Props {
  form: FormInstance<any>
  paymentData: any
  edit: boolean
  users?: any
}

const AddPaymentForm: FC<Props> = ({ form, paymentData, edit }) => {
  // TODO: fix init values

  return (
    <Form
      initialValues={{
        description: paymentData?.description,
        credit: paymentData?.credit,
        debit: paymentData?.debit,
        operation: paymentData ? paymentData.type : Operations.Credit,
      }}
      form={form}
      layout="vertical"
      className={s.Form}
    >
      <DomainsSelect disabled={edit} form={form} paymentData={paymentData} />
      <AddressesSelect disabled={edit} form={form} />
      <MonthServiceSelect disabled={edit} form={form} />
      <CompanySelect disabled={edit} form={form} />
      <Form.Item
        name="operation"
        label="Тип оплати"
        rules={validateField('required')}
      >
        <Select
          placeholder="Оберіть тип оплати"
          className={s.Select}
          disabled={edit && true}
        >
          <Select.Option value={Operations.Credit}>
            Кредит (Оплата)
          </Select.Option>
          <Select.Option value={Operations.Debit}>
            Дебет (Реалізація)
          </Select.Option>
        </Select>
      </Form.Item>

      <Form.Item
        shouldUpdate={(prevValues, currentValues) =>
          prevValues.operation !== currentValues.operation
        }
        className={s.priceItem}
      >
        {({ getFieldValue }) =>
          getFieldValue('operation') === Operations.Credit ? (
            <>
              <Form.Item
                name={Operations.Credit}
                label="Сума"
                rules={validateField('paymentPrice')}
              >
                <InputNumber
                  placeholder="Вкажіть суму"
                  disabled={edit && true}
                  className={s.inputNumber}
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
              <PaymentPricesTable
                paymentData={paymentData}
                edit={edit}
                form={form}
              />
              <PaymentTotal form={form} />
            </>
          )
        }
      </Form.Item>
    </Form>
  )
}
export default AddPaymentForm
