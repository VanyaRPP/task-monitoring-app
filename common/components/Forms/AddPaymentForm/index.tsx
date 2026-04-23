import { validateField } from '@assets/features/validators'
import { IPayment } from '@common/api/paymentApi/payment.api.types'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import { usePaymentContext } from '@components/AddPaymentModal'
import { InvoiceType } from '@components/Tables/EditInvoiceTable'
import AddressesSelect from '@components/UI/Reusable/AddressesSelect'
import DomainsSelect from '@components/UI/Reusable/DomainsSelect'
import PaymentTypeSelect from '@components/UI/Reusable/PaymentTypeSelect'
import { Operations, CURRENCY_SELECT_OPTIONS } from '@utils/constants'
import { getInvoices } from '@utils/getInvoices'
import { Form, Input, InputNumber, Select } from 'antd'
import { useMemo, useState, useEffect } from 'react'
import CompanySelect from './CompanySelect'
import InvoiceCreationDate from './InvoiceCreationDate'
import InvoiceNumber from './InvoiceNumber'
import MonthServiceSelect from './MonthServiceSelect'
import PaymentPricesTable from './PaymentPricesTable'
import PaymentTotal from './PaymentTotal'
import { inputNumberParser } from '@utils/helpers'
import type { ChangelogOption } from '@components/AddPaymentModal/changelog/types'
import s from './style.module.scss'

type AddPaymentFormProps = {
  paymentActions: { preview: boolean; edit: boolean; create?: boolean }
  changelogOptions?: ChangelogOption[]
  changelogLoading?: boolean
}

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

function AddPaymentForm({
  paymentActions,
  changelogOptions = [],
  changelogLoading,
}: AddPaymentFormProps) {
  const { preview, edit } = paymentActions
  const selectedActions = { preview, edit }

  const { form, payment, service, company, prevService, prevPayment } =
    usePaymentContext()

  const [streetHasService, setStreetHasService] = useState(false)
  const companyId = Form.useWatch('company', form)
  const operation = Form.useWatch('operation', form)
  const changelogId = Form.useWatch('changelogId', form)

  useEffect(() => {
    if (!changelogId) return
    
    const exists = changelogOptions.some(opt => opt.value === changelogId)
    if (!exists) {
      form.setFieldValue('changelogId', undefined)
    }
  }, [changelogOptions, changelogId, form])

  useInvoice({
    payment,
    service,
    company,
    prevService,
    prevPayment,
  })
  const showCurrentVersionBtn = !!changelogId
  
  
  const showChangelog = changelogOptions.length > 0
  return (
    <>
      <DomainsSelect form={form} edit={edit} />
      <AddressesSelect
        form={form}
        edit={edit}
        onStreetHasServiceChange={setStreetHasService}
        street={company?.street?._id}
      />
      <MonthServiceSelect form={form} edit={edit} />
      <CompanySelect form={form} edit={edit} company={payment?.company} />
      <PaymentTypeSelect edit={!companyId || edit} />
      <InvoiceNumber form={form} paymentActions={selectedActions} />
      <InvoiceCreationDate edit={preview} />
      
    {showChangelog && (
      <div>
        <Form.Item
          name="changelogId"
          label="Історія змін"
          tooltip="Попередні версії рахунку. Зберігаються автоматично після кожного редагування."
          style={{ width: 320 }}
        >
          <Select
            allowClear
            placeholder="Оберіть версію рахунку"
            options={changelogOptions}
            optionLabelProp="shortLabel"
            loading={changelogLoading}
            disabled={preview}
            notFoundContent={
              changelogLoading ? 'Завантаження...' : 'Історії змін ще немає'
            }
          />
        </Form.Item>
      </div>
    )}

      {operation === Operations.Credit ? (
        <>
        <Form.Item label="Сума" required>
          <div className={s.sumRow}>
            <Form.Item
              name="generalSum"
              noStyle
              rules={validateField('paymentPrice')}
            >
              <InputNumber
                parser={inputNumberParser}
                style={{ width: 160 }}
                placeholder="Вкажіть суму"
                disabled={preview}
              />
            </Form.Item>
            <Form.Item name="currency" noStyle>
              <Select
                className={s.currencySelect}
                options={CURRENCY_SELECT_OPTIONS}
                disabled={preview}
              />
            </Form.Item>
          </div>
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
          <PaymentPricesTable preview={preview} service={service} />
          <PaymentTotal form={form} />
        </>
      )}
    </>
  )
}

export default AddPaymentForm
