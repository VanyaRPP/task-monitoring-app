import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'
import { validateField } from '@assets/features/validators'
import { PlusOutlined } from '@ant-design/icons'
import { Button, Divider, Form, FormInstance, Input, Select } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import {
  getNewEntityName,
  isNewEntityValue,
  makeNewEntityValue,
} from '@utils/inlineCreate'

export interface DomainsSelectProps {
  form: FormInstance
  edit?: boolean
  disabled?: boolean
  currentProfit?: any
  // When true the user can create a brand-new provider inline: a persistent
  // "Створити нового надавача" button in the dropdown switches the field into a
  // name-input mode. The value becomes a `new::` sentinel that the owning form
  // materializes into a real Domain on submit (see AddPaymentModal).
  allowCreate?: boolean
}

const DOMAIN_TOOLTIP = 'Хто виставляє рахунок — ваша організація/ОСББ.'

const DomainsSelect: React.FC<DomainsSelectProps> = ({
  form,
  edit,
  disabled,
  currentProfit,
  allowCreate,
}) => {
  const [domains, setDomains] = useState([])
  const [search, setSearch] = useState('')
  const {
    data: fetchedDomains = [],
    isLoading: isDomainsLoading,
    isError: isDomainsError,
  } = useGetDomainsQuery({ archived: false })

  useEffect(() => {
    if (fetchedDomains.length) {
      setDomains(fetchedDomains)
    }
  }, [fetchedDomains])

  const domainValue = Form.useWatch('domain', form)
  const isNew = isNewEntityValue(domainValue)

  const options = useMemo(() => {
    return domains.map((i) => ({ value: i._id, label: i.name }))
  }, [domains])

  useEffect(() => {
    // Auto-pick the only existing provider, but never while quick-creating.
    if (!edit && !allowCreate && options.length === 1) {
      form.setFieldsValue({ domain: options[0].value })
    }
  }, [form, options, edit, allowCreate])

  const enterCreateMode = () => {
    form.setFieldValue('domain', makeNewEntityValue(search.trim()))
    setSearch('')
  }

  if (isNew) {
    return (
      <Form.Item
        name="domain"
        label="Надавач послуг"
        tooltip={DOMAIN_TOOLTIP}
        getValueProps={(v) => ({
          value: isNewEntityValue(v) ? getNewEntityName(v) : '',
        })}
        normalize={(input) => makeNewEntityValue(input ?? '')}
        rules={[
          {
            validator: (_, v) =>
              getNewEntityName(v ?? '').trim()
                ? Promise.resolve()
                : Promise.reject(new Error('Вкажіть назву надавача послуг')),
          },
        ]}
        extra={
          <Button
            type="link"
            size="small"
            style={{ padding: 0 }}
            onClick={() => form.setFieldValue('domain', undefined)}
          >
            ← обрати наявного
          </Button>
        }
      >
        <Input placeholder="Назва нового надавача послуг" />
      </Form.Item>
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
        placeholder="Пошук надавача послуг"
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
        popupRender={
          allowCreate
            ? (menu) => (
                <>
                  {menu}
                  <Divider style={{ margin: '8px 0' }} />
                  <Button
                    type="text"
                    block
                    icon={<PlusOutlined />}
                    style={{ textAlign: 'left' }}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={enterCreateMode}
                  >
                    {search.trim()
                      ? `Створити «${search.trim()}»`
                      : 'Створити нового надавача'}
                  </Button>
                </>
              )
            : undefined
        }
      />
    </Form.Item>
  )
}

export default DomainsSelect
