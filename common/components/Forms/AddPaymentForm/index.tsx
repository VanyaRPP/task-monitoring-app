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
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import { getFormattedDate } from '@common/components/DashboardPage/blocks/services'

interface Props {
  form: FormInstance<any>
  paymentData: any
  edit: boolean
  users?: any
}

const AddPaymentForm: FC<Props> = ({ form, paymentData, edit }) => {
  // TODO: fix init values

  /*const domainId = Form.useWatch('domain', form)
  const streetId = Form.useWatch('street', form)
  const month = Form.useWatch('monthService', form)
  const company = Form.useWatch('company', form)

  const { data: allRealEstate } = useGetAllRealEstateQuery({
    domainId,
    streetId,
  })

  const { data: allServices } = useGetAllServicesQuery({
    domainId,
    streetId,
  })

  const service = allServices?.find((item) => item._id === month)
  const realEstate = allRealEstate?.find((item) => item._id === company)*/

  return (
    <Form
      initialValues={{
        description: paymentData?.description,
        credit: paymentData?.credit,
        debit: paymentData?.debit,
        operation: paymentData?.debit ? Operations.Debit : Operations.Credit,
      }}
      form={form}
      layout="vertical"
      className={s.Form}
    >
      <DomainsSelect disabled={edit} form={form} />
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
          <Select.Option value="credit">Кредит (Оплата)</Select.Option>
          <Select.Option value="debit">Дебет (Реалізація)</Select.Option>
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
                name="credit"
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
