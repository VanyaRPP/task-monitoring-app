import { validateField } from '@assets/features/validators'
import { usePaymentContext } from '@components/AddPaymentModal'
import AddressesSelect from '@components/UI/Reusable/AddressesSelect'
import DomainsSelect from '@components/UI/Reusable/DomainsSelect'
import PaymentTypeSelect from '@components/UI/Reusable/PaymentTypeSelect'
import { Operations, CURRENCY_SELECT_OPTIONS } from '@utils/constants'
import { Form, Input, InputNumber, Select } from 'antd'
import { useEffect } from 'react'
import CompanySelect from './CompanySelect'
import InvoiceCreationDate from './InvoiceCreationDate'
import InvoiceNumber from './InvoiceNumber'
import MonthServiceSelect from './MonthServiceSelect'
import PaymentPricesTable from './PaymentPricesTable'
import PaymentTotal from './PaymentTotal'
import { inputNumberParser } from '@utils/helpers'
import type { ChangelogOption } from '@components/AddPaymentModal/changelog/types'
import s from './style.module.scss'
import changelogRowStyles from './changelog-row.module.scss'

type AddPaymentFormProps = {
  paymentActions: { preview: boolean; edit: boolean; create?: boolean }
  changelogOptions?: ChangelogOption[]
  changelogLoading?: boolean
}

function AddPaymentForm({
  paymentActions,
  changelogOptions = [],
  changelogLoading,
}: AddPaymentFormProps) {
  const { preview, edit } = paymentActions
  const selectedActions = { preview, edit }

  const { form, payment, service, company } = usePaymentContext()

  const operation = Form.useWatch('operation', form)
  const changelogId = Form.useWatch('changelogId', form)

  useEffect(() => {
    if (!changelogId) return

    const exists = changelogOptions.some((opt) => opt.value === changelogId)
    if (!exists) {
      form.setFieldValue('changelogId', undefined)
    }
  }, [changelogOptions, changelogId, form])

  const showChangelog = changelogOptions.length > 0

  // On a fresh invoice the user may type a brand-new provider/company name and
  // have it created on submit (see AddPaymentModal). Disabled while editing.
  const allowCreate = !edit && !preview

  return (
    <>
      <div data-invoice-tour="domain">
        <DomainsSelect form={form} edit={edit} allowCreate={allowCreate} />
      </div>
      <div data-invoice-tour="address-month">
        <AddressesSelect
          form={form}
          edit={edit}
          street={company?.street?._id}
          required={false}
        />
        <MonthServiceSelect form={form} edit={edit} />
      </div>
      <div data-invoice-tour="company">
        <CompanySelect
          form={form}
          edit={edit}
          company={payment?.company}
          allowCreate={allowCreate}
        />
      </div>
      <div data-invoice-tour="operation">
        <PaymentTypeSelect />
      </div>
      <div className={s.invoiceRow} data-invoice-tour="invoice-meta">
        <InvoiceNumber form={form} paymentActions={selectedActions} />
        <Form.Item name="currency" label="Валюта">
          <Select
            className={s.currencySelect}
            options={CURRENCY_SELECT_OPTIONS}
            disabled={preview}
            popupMatchSelectWidth={false}
          />
        </Form.Item>
      </div>
      <InvoiceCreationDate edit={preview} />

      {!preview && operation !== Operations.Credit && showChangelog ? (
        <div className={changelogRowStyles.changelogRow}>
          <div className={changelogRowStyles.changelogSelect}>
            <Form.Item
              name="changelogId"
              label="Історія змін"
              tooltip="Попередні версії рахунку. Зберігаються автоматично після кожного редагування."
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
        </div>
      ) : null}

      {operation === Operations.Credit ? (
        <div data-invoice-tour="amount">
          <Form.Item
            name="generalSum"
            label="Сума"
            tooltip="Загальна сума оплати."
            rules={validateField('paymentPrice')}
          >
            <InputNumber
              parser={inputNumberParser}
              style={{ width: 160 }}
              placeholder="Вкажіть суму"
              disabled={preview}
            />
          </Form.Item>
          <Form.Item
            name="description"
            label="Опис"
            tooltip="Призначення платежу."
            rules={validateField('required')}
          >
            <Input.TextArea
              placeholder="Введіть опис"
              maxLength={256}
              disabled={preview}
            />
          </Form.Item>
        </div>
      ) : (
        <div data-invoice-tour="amount">
          <PaymentPricesTable preview={preview} service={service} />
          <PaymentTotal form={form} />
        </div>
      )}
    </>
  )
}

export default AddPaymentForm
