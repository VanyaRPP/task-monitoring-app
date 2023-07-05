import React, { FC, useEffect } from 'react'
import { validateField } from '@common/assets/features/validators'
import { Form, FormInstance, Input, InputNumber, Select } from 'antd'
import s from './style.module.scss'
import { Operations, ServiceType } from '@utils/constants'
import AddressesSelect from '@common/components/UI/Reusable/AddressesSelect'
import DomainsSelect from '@common/components/UI/Reusable/DomainsSelect'
import CompanySelect from './CompanySelect'
import PaymentTotal from './PaymentTotal'
import PaymentPricesTable from './PaymentPricesTable'
import MonthServiceSelect from './MonthServiceSelect'
import { usePaymentContext } from '@common/components/AddPaymentModal'
// import useDomain from '@common/modules/hooks/useDomain'
import useService from '@common/modules/hooks/useService'
import moment from 'moment'

interface Props {
  form: FormInstance<any>
  paymentData: any
  edit: boolean
  users?: any
}

const AddPaymentForm: FC<Props> = ({ edit }) => {
  const { paymentData, form } = usePaymentContext()

  // const { data: domains } = useDomain({ domainId: edit && paymentData?.domain  })
  const { service } = useService({
    serviceId: paymentData?.monthService,
    domainId: paymentData?.domain,
    streetId: paymentData?.street[0],
  })

  const month = moment(service?.date).format('MMMM')

  const invoices = {
    maintenance: paymentData?.invoice.find(
      (item) => item?.type === ServiceType.Maintenance
    ),
    placing: paymentData?.invoice.find(
      (item) => item?.type === ServiceType.Placing
    ),
    electricity: paymentData?.invoice.find(
      (item) => item?.type === ServiceType.Electricity
    ),
    water: paymentData?.invoice.find(
      (item) => item?.type === ServiceType.Water
    ),
  }

  const initialValues = {
    domain: paymentData?.domain,
    street: paymentData?.street?._id,
    // street: paymentData?.street && `${paymentData.street.address} (м. ${paymentData.street.city})`,
    monthService: month.charAt(0).toUpperCase() + month.slice(1),
    company: paymentData?.company.companyName,
    description: paymentData?.description,
    credit: paymentData?.credit,
    debit: paymentData?.debit,
    operation: paymentData ? paymentData.type : Operations.Credit,
    [ServiceType.Maintenance]: {
      amount: invoices.maintenance?.amount,
      price: invoices.maintenance?.price,
    },
    [ServiceType.Placing]: {
      amount: invoices.placing?.amount,
      price: invoices.placing?.price,
    },
    [ServiceType.Electricity]: {
      lastAmount: invoices.electricity?.lastAmount,
      amount: invoices.electricity?.amount,
      price: invoices.electricity?.price,
    },
    [ServiceType.Water]: {
      lastAmount: invoices.water?.lastAmount,
      amount: invoices.water?.amount,
      price: invoices.water?.price,
    },
  }
  // TODO: fix initialValues
  // something strange
  // MonthServiceSelect CompanySelect
  // infinite render
  return (
    <Form
      // initialValues={initialValues}
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
                  defaultValue={paymentData ? paymentData?.generalSum : ''}
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
