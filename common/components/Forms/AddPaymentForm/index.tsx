import { validateField } from '@assets/features/validators'
import { IPayment } from '@common/api/paymentApi/payment.api.types'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import { usePaymentContext } from '@components/AddPaymentModal'
import { InvoiceType } from '@components/Tables/EditInvoiceTable'
import AddressesSelect from '@components/UI/Reusable/AddressesSelect'
import DomainsSelect from '@components/UI/Reusable/DomainsSelect'
import PaymentTypeSelect from '@components/UI/Reusable/PaymentTypeSelect'
import { Operations } from '@utils/constants'
import { getInvoices } from '@utils/getInvoices'
import { Form, Input, InputNumber } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import CompanySelect from './CompanySelect'
import InvoiceCreationDate from './InvoiceCreationDate'
import InvoiceNumber from './InvoiceNumber'
import MonthServiceSelect from './MonthServiceSelect'
import PaymentPricesTable from './PaymentPricesTable'
import PaymentTotal from './PaymentTotal'
import { inputNumberParser } from '@utils/helpers'

export const useInvoice = ({
  payment,
  service,
  company,
  prevService,
  prevPayment,
}: {
  payment?: IPayment
  service?: IService
  company?: IRealestate
  prevService?: IService
  prevPayment?: IPayment
}): Omit<InvoiceType, 'sum'>[] => {
  const invoices = useMemo(() => {
    return getInvoices({ payment, service, company, prevService, prevPayment })
  }, [payment, service, company, prevService, prevPayment])
  return invoices
}

function AddPaymentForm({ paymentActions }) {
  const { preview, edit } = paymentActions

  const { form, payment, service, company, prevService, prevPayment } =
    usePaymentContext()

  const [streetHasService, setStreetHasService] = useState(false)

  const companyId = Form.useWatch('company', form)
  const operation = Form.useWatch('operation', form)

  const invoice = useInvoice({
    payment,
    service,
    company,
    prevService,
    prevPayment,
  })

  useEffect(() => {
    form.setFieldsValue({ invoice })
  }, [form, invoice])

  return (
    <>
      <DomainsSelect form={form} edit={edit} />
      <AddressesSelect
        form={form}
        edit={edit}
        onStreetHasServiceChange={setStreetHasService}
      />
      <MonthServiceSelect
        form={form}
        edit={edit}
        disabled={!streetHasService}
      />
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
            <InputNumber
              parser={inputNumberParser}
              style={{ minWidth: '166px' }}
              placeholder="Вкажіть суму"
              disabled={preview}
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
          <PaymentPricesTable preview={preview} />
          <PaymentTotal form={form} />
        </>
      )}
    </>
  )
}

export default AddPaymentForm
