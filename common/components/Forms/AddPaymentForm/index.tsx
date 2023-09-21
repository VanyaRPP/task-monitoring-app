import React from 'react'
import { validateField } from '@common/assets/features/validators'
import { Form, Input, InputNumber } from 'antd'
import s from './style.module.scss'
import { Operations, ServiceType } from '@utils/constants'
import AddressesSelect from '@common/components/UI/Reusable/AddressesSelect'
import DomainsSelect from '@common/components/UI/Reusable/DomainsSelect'
import CompanySelect from './CompanySelect'
import PaymentTotal from './PaymentTotal'
import PaymentPricesTable from './PaymentPricesTable'
import MonthServiceSelect from './MonthServiceSelect'
import { usePaymentContext } from '@common/components/AddPaymentModal'
import moment from 'moment'
import InvoiceNumber from './InvoiceNumber'
import InvoiceCreationDate from './InvoiceCreationDate'
import { getFormattedDate } from '@utils/helpers'
import PaymentTypeSelect from '@common/components/UI/Reusable/PaymentTypeSelect'

function AddPaymentForm({ paymentActions }) {
  const initialValues = useInitialValues()
  const { form } = usePaymentContext()
  const serviceId = Form.useWatch('monthService', form)
  const companyId = Form.useWatch('company', form)
  const operation = Form.useWatch('operation', form)
  const { preview } = paymentActions

  return (
    <Form
      initialValues={initialValues}
      form={form}
      layout="vertical"
      className={s.Form}
    >
      <DomainsSelect form={form} />

      <AddressesSelect form={form} />

      <MonthServiceSelect form={form} />

      <CompanySelect form={form} />
      <PaymentTypeSelect edit={!companyId || preview} />

      <InvoiceNumber form={form} paymentActions={paymentActions} />
      <InvoiceCreationDate edit={preview} />

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
                name="generalSum"
                label="Сума"
                rules={validateField('paymentPrice')}
              >
                <InputNumber
                  placeholder="Вкажіть суму"
                  disabled={preview}
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
                  disabled={preview}
                />
              </Form.Item>
            </>
          ) : (
            <>
              <PaymentPricesTable
                key={companyId + serviceId + operation}
                paymentActions={paymentActions}
              />
              <PaymentTotal form={form} />
            </>
          )
        }
      </Form.Item>
    </Form>
  )
}

function useInitialValues() {
  const { paymentData } = usePaymentContext()

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
    waterPart: paymentData?.invoice.find(
      (item) => item?.type === ServiceType.WaterPart
    ),
    garbageCollector: paymentData?.invoice.find(
      (item) => item?.type === ServiceType.GarbageCollector
    ),
    inflicion: paymentData?.invoice.find(
      (item) => item?.type === ServiceType.Inflicion
    ),
    discount: paymentData?.invoice.find(
      (item) => item?.type === ServiceType.Discount
    ),
    cleaning: paymentData?.invoice.find(
      (item) => item?.type === ServiceType.Cleaning
    ),
    custom: paymentData?.invoice.filter(
      (item) => item?.type === ServiceType.Custom
    ),
  }
  const customFields = invoices.custom?.reduce((acc, item) => {
    acc[item.name] = { price: item.price }
    return acc
  }, {})

  // TODO: add useEffect || useCallback ?
  // currently we have few renders
  // we need it only once. on didmount (first render)
  const initialValues = {
    domain: paymentData?.domain?._id,
    street: paymentData?.street?._id,
    monthService: paymentData?.monthService?._id,
    company: paymentData?.company?._id,
    description: paymentData?.description,
    credit: paymentData?.credit,
    generalSum: paymentData?.generalSum,
    debit: paymentData?.debit,
    invoiceNumber: paymentData?.invoiceNumber,
    invoiceCreationDate: moment(paymentData?.invoiceCreationDate),
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
    [ServiceType.WaterPart]: {
      price: invoices.waterPart?.sum,
    },
    [ServiceType.GarbageCollector]: {
      amount: invoices.garbageCollector?.amount,
      price: invoices.garbageCollector?.price,
    },
    [ServiceType.Inflicion]: {
      price: invoices.inflicion?.price,
    },
    [ServiceType.Discount]: {
      price: invoices.discount?.price,
    },
    [ServiceType.Cleaning]: {
      price: invoices.cleaning?.price,
    },
    ...customFields,
  }

  return initialValues
}
export default AddPaymentForm
