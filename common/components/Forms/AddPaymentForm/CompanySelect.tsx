import { validateField } from '@assets/features/validators'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { Button, Form, Input, Select } from 'antd'
import { FormInstance } from 'antd/es/form/Form'
import { useEffect, useMemo, useState } from 'react'
import {
  getNewEntityName,
  isNewEntityValue,
  makeNewEntityValue,
} from '@utils/inlineCreate'
import s from './CompanySelect.module.scss'

const COMPANY_TOOLTIP = 'Кому виставляється рахунок — орендар/платник.'
const EMAIL_TOOLTIP = 'Пошта, яка відображатиметься в рахунку як отримувач.'

interface Props {
  form: FormInstance
  edit?: boolean
  company?: string | Partial<IRealestate>
  // When true the user can create a brand-new company inline: a persistent
  // "Створити нову компанію" button in the dropdown switches the field into a
  // name + email input mode. The value becomes a `new::` sentinel that
  // AddPaymentModal materializes into a real company on submit.
  allowCreate?: boolean
}

export default function CompanySelect({
  form,
  edit,
  company,
  allowCreate,
}: Props) {
  const domainId = Form.useWatch('domain', form)

  if (!domainId) {
    return (
      <Form.Item label="Компанія" tooltip={COMPANY_TOOLTIP}>
        <Select placeholder="Спершу оберіть надавача послуг" disabled />
      </Form.Item>
    )
  }

  return (
    <CompanyPicker
      domainId={domainId}
      form={form}
      edit={edit}
      company={company}
      allowCreate={allowCreate}
    />
  )
}

interface CompanyPickerProps {
  domainId: string
  form: FormInstance
  edit?: boolean
  company?: string | Partial<IRealestate>
  allowCreate?: boolean
}

function CompanyPicker({
  domainId,
  form,
  edit,
  company,
  allowCreate,
}: CompanyPickerProps) {
  const streetId = Form.useWatch('street', form)
  const companyValue = Form.useWatch('company', form)
  const [search, setSearch] = useState('')

  const isNewDomain = isNewEntityValue(domainId)
  const isNewCompany = isNewEntityValue(companyValue)

  const { data, isLoading } = useGetAllRealEstateQuery(
    { domainId, streetId },
    { skip: isNewDomain }
  )

  const companies = useMemo(() => data?.data ?? [], [data])

  useEffect(() => {
    if (edit) return
    // Never override a typed "new" company with an auto-pick.
    if (isNewEntityValue(form.getFieldValue('company'))) return
    if (companies.length === 1) {
      form.setFieldValue('company', companies[0]._id)
    } else if (companies.length > 0 && company) {
      const companyId = typeof company === 'object' ? company._id : company
      if (form.getFieldValue('company') !== companyId) {
        form.setFieldValue('company', companyId)
      }
    }
  }, [companies, company, edit, form])

  useEffect(() => {
    // Force create mode when there's nothing to pick: a brand-new provider has
    // no companies, and a user with no companies of their own can only create.
    if (edit || !allowCreate || isLoading) return
    if (!isNewDomain && companies.length > 0) return
    queueMicrotask(() => {
      if (!isNewEntityValue(form.getFieldValue('company'))) {
        form.setFieldValue('company', makeNewEntityValue(''))
      }
    })
  }, [isNewDomain, companies.length, allowCreate, edit, isLoading, form])

  const options = useMemo(
    () => companies.map((i) => ({ value: i._id, label: i.companyName })),
    [companies]
  )

  const commitTypedValue = () => {
    const typed = search.trim()
    if (!typed) return
    const match = companies.find(
      (c) => c.companyName?.trim().toLowerCase() === typed.toLowerCase()
    )
    form.setFieldValue('company', match ? match._id : makeNewEntityValue(typed))
    setSearch('')
  }

  const exitCreateMode = () => {
    form.setFieldValue('company', undefined)
    form.setFieldValue('companyEmail', undefined)
  }

  if (isNewCompany) {
    return (
      <>
        <div className={s.companyRow}>
          <Form.Item
            name="company"
            label="Компанія"
            tooltip={COMPANY_TOOLTIP}
            className={s.companyField}
            getValueProps={(v) => ({
              value: isNewEntityValue(v) ? getNewEntityName(v) : '',
            })}
            normalize={(input) => makeNewEntityValue(input ?? '')}
            rules={[
              {
                validator: (_, v) =>
                  getNewEntityName(v ?? '').trim()
                    ? Promise.resolve()
                    : Promise.reject(new Error('Вкажіть назву компанії')),
              },
            ]}
          >
            <Input placeholder="Назва нової компанії" />
          </Form.Item>
          <Form.Item
            name="companyEmail"
            label="Пошта компанії"
            tooltip={EMAIL_TOOLTIP}
            rules={validateField('email')}
            className={s.emailField}
          >
            <Input placeholder="email@example.com" />
          </Form.Item>
        </div>
        {!isNewDomain && companies.length > 0 && (
          <Button
            type="link"
            size="small"
            style={{ padding: 0, marginTop: -4, marginBottom: 8 }}
            onClick={exitCreateMode}
          >
            ← обрати наявну
          </Button>
        )}
      </>
    )
  }

  return (
    <Form.Item
      name="company"
      label="Компанія"
      tooltip={COMPANY_TOOLTIP}
      rules={validateField('required')}
    >
      <Select
        options={options}
        optionFilterProp="label"
        placeholder={
          allowCreate ? 'Пошук або назва нової компанії' : 'Пошук компанії'
        }
        loading={isLoading}
        showSearch
        allowClear
        searchValue={search}
        onSearch={setSearch}
        onChange={() => setSearch('')}
        onBlur={allowCreate ? commitTypedValue : undefined}
        onInputKeyDown={
          allowCreate
            ? (e) => {
                if (e.key === 'Enter') commitTypedValue()
              }
            : undefined
        }
        notFoundContent={
          allowCreate && search.trim()
            ? 'Немає збігів — натисніть Enter, щоб створити нову компанію'
            : undefined
        }
      />
    </Form.Item>
  )
}
