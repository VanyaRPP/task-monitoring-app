import { useEffect, useMemo } from 'react'
import { Form, FormInstance, Select } from 'antd'
import { useTranslation } from 'next-i18next'
import { validateField } from '@assets/features/validators'
import { useAppSelector } from '@modules/store/hooks'
import {
  decodeProfitScopeKey,
  encodeProfitScopeKey,
  useProfitScopes,
} from '@components/Pages/ProfiitPage/hook/useProfitScopes'

export const PROFIT_SCOPE_FIELD = 'scope'

interface Props {
  form: FormInstance
  disabled?: boolean
}

/**
 * Picks the ledger a record goes to - any domain or company the user can
 * open on the Прибутки page, grouped the same way as that page's selector.
 * The value is an encoded scope key (`domain:<id>` / `company:<id>`).
 *
 * Used where the modal is not opened from that page (an AI draft), so the
 * target is chosen here. Without one in the form it falls back like the page
 * does: the scope selected there, else the first domain, else the first
 * company.
 */
const ProfitScopeSelect: React.FC<Props> = ({ form, disabled }) => {
  const { t } = useTranslation()
  const { domainOptions, companyOptions, isLoading } = useProfitScopes()
  const pageScopeKey = useAppSelector((state) => state.profitPage.activeTabKey)
  const value = Form.useWatch(PROFIT_SCOPE_FIELD, form)

  const keys = useMemo(
    () =>
      [...domainOptions, ...companyOptions].map(({ type, key }) =>
        encodeProfitScopeKey(type, key)
      ),
    [domainOptions, companyOptions]
  )

  useEffect(() => {
    if (isLoading || keys.length === 0) return
    // Read from the form, not the watched value: on the first render the
    // watch is still empty even when the draft has already set a scope.
    const current = form.getFieldValue(PROFIT_SCOPE_FIELD)
    if (current && keys.includes(current)) return
    const fallback = keys.includes(pageScopeKey) ? pageScopeKey : keys[0]
    form.setFieldsValue({ [PROFIT_SCOPE_FIELD]: fallback })
  }, [form, keys, pageScopeKey, isLoading, value])

  const groups = [
    domainOptions.length > 0 && {
      label: t('profitPage:scope.domainsGroup'),
      options: domainOptions.map((o) => ({
        value: encodeProfitScopeKey(o.type, o.key),
        label: o.label,
      })),
    },
    companyOptions.length > 0 && {
      label: t('profitPage:scope.companiesGroup'),
      options: companyOptions.map((o) => ({
        value: encodeProfitScopeKey(o.type, o.key),
        label: o.label,
      })),
    },
  ].filter(Boolean)

  return (
    <Form.Item
      name={PROFIT_SCOPE_FIELD}
      label={t('profitPage:form.scope')}
      rules={validateField('required')}
    >
      <Select
        options={groups}
        loading={isLoading}
        showSearch
        optionFilterProp="label"
        placeholder={t('profitPage:scope.placeholder')}
        disabled={disabled}
      />
    </Form.Item>
  )
}

/** The `{ domain }` / `{ company }` part of a request body for a scope key. */
export const scopeKeyToTarget = (key: string | undefined) => {
  const scope = decodeProfitScopeKey(key)
  return scope ? { [scope.type]: scope.id } : {}
}

export default ProfitScopeSelect
