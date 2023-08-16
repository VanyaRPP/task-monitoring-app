import React, { FC } from 'react'
import { validateField } from '@common/assets/features/validators'
import {
  Form,
  FormInstance,
  Input,
  InputNumber,
  Select,
  DatePicker,
} from 'antd'
import s from './style.module.scss'
import { Operations, ServiceType } from '@utils/constants'
import AddressesSelect from '@common/components/UI/Reusable/AddressesSelect'
import DomainsSelect from '@common/components/UI/Reusable/DomainsSelect'
import CompanySelect from './CompanySelect'
import PaymentTotal from './PaymentTotal'
import PaymentPricesTable from './PaymentPricesTable'
import MonthServiceSelect from './MonthServiceSelect'
import { usePaymentContext } from '@common/components/AddPaymentModal'
import { getFormattedDate } from '@common/components/DashboardPage/blocks/services'
// import moment from 'moment'
import InvoiceNumber from './InvoiceNumber'

interface Props {
  form: FormInstance<any>
  paymentData: any
  edit: boolean
  users?: any
}

const AddPaymentForm: FC<Props> = ({ edit }) => {
  const { form } = usePaymentContext()
  const initialValues = useInitialValues({ edit })

  return (
    <Form
      initialValues={initialValues}
      form={form}
      layout="vertical"
      className={s.Form}
    >
      {edit ? (
        <Form.Item name="domain" label="Домен">
          <Input disabled />
        </Form.Item>
      ) : (
        <DomainsSelect form={form} />
      )}

      {edit ? (
        <Form.Item name="street" label="Адреса">
          <Input disabled />
        </Form.Item>
      ) : (
        <AddressesSelect form={form} />
      )}

      {edit ? (
        <Form.Item name="monthService" label="Місяць">
          <Input disabled />
        </Form.Item>
      ) : (
        <MonthServiceSelect form={form} />
      )}

      {edit ? (
        <Form.Item name="company" label="Компанія">
          <Input disabled />
        </Form.Item>
      ) : (
        <CompanySelect form={form} />
      )}

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

      <InvoiceNumber form={form} edit={edit} />

      {/* <Form.Item name="invoiceCreationDate" label="Оплата від">
        <DatePicker.RangePicker
          // value={initialValues.rentPeriod}
          format="DD.MM.YYYY"
          disabled={edit}
        />
      </Form.Item> */}

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
                  disabled={edit}
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
              <PaymentPricesTable edit={edit} form={form} />
              <PaymentTotal form={form} />
            </>
          )
        }
      </Form.Item>
    </Form>
  )
}

function useInitialValues({ edit }) {
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
    custom: paymentData?.invoice.filter(
      (item) => item?.type === ServiceType.Custom
    ),
  }
  const customFields = invoices.custom?.reduce((acc, item) => {
    acc[item.name] = { price: item.price }
    return acc
  }, {})

  const initialValues = {
    domain: paymentData?.domain?.name,
    street:
      paymentData?.street &&
      `${paymentData.street.address} (м. ${paymentData.street.city})`,
    monthService: getFormattedDate(paymentData?.monthService?.date),
    company: paymentData?.company.companyName,
    description: paymentData?.description,
    credit: paymentData?.credit,
    generalSum: paymentData?.paymentData,
    debit: paymentData?.debit,
    invoiceCreationDate: Date.now(),
    // TODO:
    // invoiceCreationDate: [moment(), moment().add(1, 'M')],
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
      price: invoices.waterPart?.price,
    },
    [ServiceType.GarbageCollector]: {
      price: invoices.garbageCollector?.price,
    },
    [ServiceType.Inflicion]: {
      price: invoices.inflicion?.price,
    },
    ...customFields,
  }
  return initialValues
}
export default AddPaymentForm
