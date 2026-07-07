import {
  useGetDomainsQuery,
  useGetDomainTypeTemplatesQuery,
} from '@common/api/domainApi/domain.api'
import { validateField } from '@assets/features/validators'
import { Button, Form, FormInstance, Input, Select } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import {
  getNewEntityName,
  isNewEntityValue,
  makeNewEntityValue,
} from '@utils/inlineCreate'
import s from './DomainsSelect.module.scss'

export interface DomainsSelectProps {
  form: FormInstance
  edit?: boolean
  disabled?: boolean
  currentProfit?: any
  // When true the user can create a brand-new provider inline: a persistent
  // "Створити нового надавача" button in the dropdown switches the field into a
  // name-input mode (+ a service-type picker). The value becomes a `new::`
  // sentinel that the owning form materializes into a real Domain on submit
  // (see AddPaymentModal).
  allowCreate?: boolean
}

const DOMAIN_TOOLTIP = 'Хто виставляє рахунок — ваша організація/ОСББ.'
const TEMPLATE_TOOLTIP =
  'Набір послуг для надавача. «Без послуг» — почати з чистого аркуша.'

const DomainsSelect: React.FC<DomainsSelectProps> = ({
  form,
  edit,
  disabled,
  currentProfit,
  allowCreate,
}) => {
  const [search, setSearch] = useState('')
  const {
    data: domains = [],
    isLoading: isDomainsLoading,
    isError: isDomainsError,
  } = useGetDomainsQuery({ archived: false })

  const { data: typeTemplates = [], isLoading: isTemplatesLoading } =
    useGetDomainTypeTemplatesQuery(undefined, { skip: !allowCreate })

  const domainValue = Form.useWatch('domain', form)
  const isNew = isNewEntityValue(domainValue)

  const options = useMemo(() => {
    return domains.map((i) => ({ value: i._id, label: i.name }))
  }, [domains])

  const templateOptions = useMemo(
    () => [
      { value: '', label: 'Без послуг' },
      ...typeTemplates.map((t) => ({
        value: t._id,
        label: t.isBuiltIn ? t.name : `${t.name} (адмін)`,
      })),
    ],
    [typeTemplates]
  )

  useEffect(() => {
    // Auto-pick the only existing provider, but never while quick-creating.
    if (!edit && !allowCreate && options.length === 1) {
      form.setFieldsValue({ domain: options[0].value })
    }
  }, [form, options, edit, allowCreate])

  // With no providers of their own, the user can only create one — drop straight
  // into name-input mode so the extra fields show without any picking.
  useEffect(() => {
    if (edit || !allowCreate || isDomainsLoading) return
    if (options.length === 0 && !form.getFieldValue('domain')) {
      form.setFieldsValue({
        domain: makeNewEntityValue(''),
        newDomainTemplateId: '',
      })
    }
  }, [options, allowCreate, edit, isDomainsLoading, form])

  const commitTypedValue = () => {
    const typed = search.trim()
    if (!typed) return
    const match = options.find(
      (o) => o.label?.trim().toLowerCase() === typed.toLowerCase()
    )
    form.setFieldsValue(
      match
        ? { domain: match.value }
        : { domain: makeNewEntityValue(typed), newDomainTemplateId: '' }
    )
    setSearch('')
  }

  const exitCreateMode = () => {
    form.setFieldsValue({ domain: undefined, newDomainTemplateId: undefined })
  }

  if (isNew) {
    return (
      <>
        <div className={s.createRow}>
          <Form.Item
            name="domain"
            label="Надавач послуг"
            tooltip={DOMAIN_TOOLTIP}
            className={s.nameField}
            getValueProps={(v) => ({
              value: isNewEntityValue(v) ? getNewEntityName(v) : '',
            })}
            normalize={(input) => makeNewEntityValue(input ?? '')}
            rules={[
              {
                validator: (_, v) =>
                  getNewEntityName(v ?? '').trim()
                    ? Promise.resolve()
                    : Promise.reject(
                        new Error('Вкажіть назву надавача послуг')
                      ),
              },
            ]}
          >
            <Input placeholder="Назва надавача" />
          </Form.Item>
          <Form.Item
            name="newDomainTemplateId"
            label="Напрямок послуг"
            tooltip={TEMPLATE_TOOLTIP}
            className={s.templateField}
          >
            <Select
              options={templateOptions}
              optionFilterProp="label"
              placeholder="Без послуг"
              loading={isTemplatesLoading}
              showSearch
            />
          </Form.Item>
        </div>
        {options.length > 0 && (
          <Button
            type="link"
            size="small"
            style={{ padding: 0, marginBottom: 8 }}
            onClick={exitCreateMode}
          >
            ← обрати наявного
          </Button>
        )}
      </>
    )
  }

  return (
    <Form.Item
      name="domain"
      label="Надавач послуг"
      tooltip={DOMAIN_TOOLTIP}
      rules={!disabled && !currentProfit ? validateField('required') : []}
    >
      <Select
        options={options}
        optionFilterProp="label"
        placeholder={
          allowCreate
            ? 'Пошук або назва нового надавача'
            : 'Пошук надавача послуг'
        }
        status={isDomainsError && 'error'}
        loading={isDomainsLoading}
        disabled={
          disabled ??
          (isDomainsLoading || (!allowCreate && domains.length <= 1 && !edit))
        }
        allowClear
        showSearch
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
            ? 'Немає збігів — натисніть Enter, щоб створити нового надавача'
            : undefined
        }
      />
    </Form.Item>
  )
}

export default DomainsSelect
