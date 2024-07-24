import { useGetAllPaymentsQuery } from '@common/api/paymentApi/payment.api'
import { IPayment } from '@common/api/paymentApi/payment.api.types'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import { IService } from '@common/api/serviceApi/service.api.types'
import { validateField } from '@common/assets/features/validators'
import { usePaymentContext } from '@common/components/AddPaymentModal'
import { InvoiceType } from '@common/components/Tables/EditInvoiceTable'
import AddressesSelect from '@common/components/UI/Reusable/AddressesSelect'
import DomainsSelect from '@common/components/UI/Reusable/DomainsSelect'
import PaymentTypeSelect from '@common/components/UI/Reusable/PaymentTypeSelect'
import { Operations } from '@utils/constants'
import { getInvoices } from '@utils/getInvoices'
import { Form, FormInstance, Input, InputNumber } from 'antd'
import moment from 'moment'
import { useEffect, useMemo } from 'react'
import CompanySelect from './CompanySelect'
import InvoiceCreationDate from './InvoiceCreationDate'
import InvoiceNumber from './InvoiceNumber'
import MonthServiceSelect from './MonthServiceSelect'
import PaymentPricesTable from './PaymentPricesTable'
import PaymentTotal from './PaymentTotal'

export const useInvoice = ({
  payment,
  service,
  company,
  prevPayment,
}: {
  payment?: IPayment
  service?: IService
  company?: IRealestate
  prevPayment?: IPayment
}): Omit<InvoiceType, 'sum'>[] => {
  const invoices = useMemo(() => {
    return getInvoices({ payment, service, company, prevPayment })
  }, [payment, service, company, prevPayment])
  return invoices
}

export const usePaymentFormData = (
  form: FormInstance
): {
  service?: IService
  company?: IRealestate
  prevPayment?: IPayment
} => {
  const domainId = Form.useWatch('domain', form)
  const serviceId = Form.useWatch('monthService', form)
  const companyId = Form.useWatch('company', form)

  const { data: { data: { 0: service } } = { data: { 0: null } } } =
    useGetAllServicesQuery({ serviceId }, { skip: !serviceId })

  const { data: { data: { 0: company } } = { data: { 0: null } } } =
    useGetAllRealEstateQuery(
      { companyId },
      {
        skip: !companyId,
      }
    )

  const { data: { data: { 0: prevPayment } } = { data: { 0: null } } } =
    useGetAllPaymentsQuery(
      {
        companyIds: companyId,
        domainIds: domainId,
        month: moment(service?.date).month() - 1,
        limit: 1,
      },
      { skip: !service }
    )

  return {
    service: serviceId ? service : null,
    company: companyId ? company : null,
    prevPayment: domainId && service && companyId ? prevPayment : null,
  }
}

function AddPaymentForm({ paymentActions }) {
  const { preview, edit } = paymentActions

  const { form, payment } = usePaymentContext()

  const { service, company, prevPayment } = usePaymentFormData(form)

  const companyId = Form.useWatch('company', form)
  const operation = Form.useWatch('operation', form)

  const invoice = useInvoice({ payment, service, company, prevPayment })

  useEffect(() => {
    form.setFieldsValue({ invoice })
  }, [form, invoice])

  return (
    <>
      <DomainsSelect form={form} edit={edit} />
      <AddressesSelect form={form} edit={edit} />
      <MonthServiceSelect form={form} edit={edit} />
      <CompanySelect form={form} edit={edit} />
      <PaymentTypeSelect edit={!companyId || edit} />
      <InvoiceNumber form={form} paymentActions={paymentActions} />
      <InvoiceCreationDate edit={preview} />

      {operation === Operations.Credit ? (
        <>
          <Form.Item
            name="generalSum"
            label="Сума"
            rules={validateField('paymentPrice')}
          >
            <InputNumber placeholder="Вкажіть суму" disabled={preview} />
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
          <PaymentPricesTable preview={preview} />
          <PaymentTotal form={form} />
        </>
      )}
    </>
  )
}

export default AddPaymentForm
