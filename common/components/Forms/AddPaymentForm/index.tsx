import { validateField } from '@assets/features/validators'
import { usePaymentContext } from '@components/AddPaymentModal'
import AddressesSelect from '@components/UI/Reusable/AddressesSelect'
import DomainsSelect from '@components/UI/Reusable/DomainsSelect'
import { Operations, CURRENCY_SELECT_OPTIONS } from '@utils/constants'
import { Collapse, Form, Input, InputNumber, Select } from 'antd'
import { useEffect } from 'react'
import CompanySelect from './CompanySelect'
import DetailsSummary from './DetailsSummary'
import InvoiceCreationDate from './InvoiceCreationDate'
import InvoiceNumber from './InvoiceNumber'
import MonthServiceSelect from './MonthServiceSelect'
import PaymentPricesTable from './PaymentPricesTable'
import PaymentTotal from './PaymentTotal'
import { inputNumberParser } from '@utils/helpers'
import { isNewEntityValue } from '@utils/inlineCreate'
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

  // The company list is not narrowed by the address, so the address follows
  // the chosen company instead. One with an address is preselected by
  // AddressesSelect; one without must not keep the address that was picked
  // automatically for the provider, or it would be billed on that address's
  // tariffs.
  const companyId = company?._id
  const companyHasStreet = Boolean(company?.street?._id)
  useEffect(() => {
    if (edit || preview || !companyId || companyHasStreet) return
    // An address typed in to be created on save is the user's own choice.
    if (isNewEntityValue(form.getFieldValue('street'))) return
    form.setFieldValue('street', undefined)
  }, [companyId, companyHasStreet, edit, preview, form])

  // On a fresh invoice the user may type a brand-new provider/company name and
  // have it created on submit (see AddPaymentModal). Disabled while editing.
  const allowCreate = !edit && !preview

  return (
    <>
      <div data-invoice-tour="domain">
        <DomainsSelect form={form} edit={edit} allowCreate={allowCreate} />
      </div>
      <div data-invoice-tour="company">
        <CompanySelect
          form={form}
          edit={edit}
          company={payment?.company}
          allowCreate={allowCreate}
          filterByStreet={false}
        />
      </div>
      <div data-invoice-tour="month">
        <MonthServiceSelect form={form} edit={edit} />
      </div>
      {/* An invoice and a payment are opened from different buttons, so the
          type is not a choice made in the form - but it is still its value. */}
      <Form.Item name="operation" hidden>
        <Input />
      </Form.Item>

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

      <div data-invoice-tour="details">
        <Collapse
          ghost
          className={s.details}
          items={[
            {
              key: 'details',
              label: <DetailsSummary form={form} />,
              // Kept mounted while collapsed: the fields set their own
              // defaults (address, number), and a field that is not mounted
              // is left out of the saved values.
              forceRender: true,
              children: (
                <>
                  <AddressesSelect
                    form={form}
                    edit={edit}
                    street={company?.street?._id}
                    required={false}
                  />
                  <div className={s.invoiceRow}>
                    <InvoiceNumber
                      form={form}
                      paymentActions={selectedActions}
                    />
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

                  {!preview &&
                  operation !== Operations.Credit &&
                  showChangelog ? (
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
                              changelogLoading
                                ? 'Завантаження...'
                                : 'Історії змін ще немає'
                            }
                          />
                        </Form.Item>
                      </div>
                    </div>
                  ) : null}
                </>
              ),
            },
          ]}
        />
      </div>
    </>
  )
}

export default AddPaymentForm
