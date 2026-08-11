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

  const templateOptions = useMemo(() => {
    const uniqueCategories = new Map()

    typeTemplates.forEach((t) => {
      const categoryLabel = t.category || t.name
      if (!uniqueCategories.has(categoryLabel)) {
        uniqueCategories.set(categoryLabel, t._id)
      }
    })

    const mappedOptions = Array.from(uniqueCategories.entries()).map(
      ([label, id]) => ({
        value: id,
        label: label,
      })
    )

    return [{ value: '', label: 'Без послуг' }, ...mappedOptions]
  }, [typeTemplates])

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

  const handleSearch = (value: string) => {
    const trimmed = value.trim()
    const hasMatch =
      !trimmed ||
      options.some((o) =>
        o.label?.toLowerCase().includes(trimmed.toLowerCase())
      )
    if (allowCreate && !isDomainsLoading && trimmed && !hasMatch) {
      form.setFieldsValue({
        domain: makeNewEntityValue(value),
        newDomainTemplateId: '',
      })
      setSearch('')
      return
    }
    setSearch(value)
  }

  const commitTypedValue = () => {
    const typed = search.trim()
    if (!typed) return
    const match = options.find(
      (o) => o.label?.trim().toLowerCase() === typed.toLowerCase()
    )
    if (match) {
      form.setFieldsValue({ domain: match.value })
      setSearch('')
    }
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
            <Input placeholder="Назва надавача" autoFocus />
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
        onSearch={allowCreate ? handleSearch : setSearch}
        onChange={() => setSearch('')}
        onBlur={allowCreate ? commitTypedValue : undefined}
      />
    </Form.Item>
  )
}

export default DomainsSelect
