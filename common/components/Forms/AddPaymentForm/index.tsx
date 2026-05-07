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

  return (
    <>
      <DomainsSelect form={form} edit={edit} />
      <AddressesSelect
        form={form}
        edit={edit}
        street={company?.street?._id}
      />
      <MonthServiceSelect form={form} edit={edit} />
      <CompanySelect form={form} edit={edit} company={payment?.company} />
      <PaymentTypeSelect />
      <div className={s.invoiceRow}>
        <InvoiceNumber form={form} paymentActions={selectedActions} />
        <Form.Item name="currency" label=" ">
          <Select
            className={s.currencySelect}
            options={CURRENCY_SELECT_OPTIONS}
            disabled={preview}
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
        <>
          <Form.Item
            name="generalSum"
            label="Сума"
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
