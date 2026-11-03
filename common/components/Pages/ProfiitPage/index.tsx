'use client'

import FullScreenWrapper from '@components/UI/fullScreenTableWrapper/fullScreenTableWrapper'
import { useAppDispatch, useAppSelector } from '@modules/store/hooks'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { setActiveTabKey } from '@modules/store/profitPageSlice'
import { useEffect, useMemo, useState } from 'react'
import {
  useProfitScopes,
  encodeProfitScopeKey,
  decodeProfitScopeKey,
} from './hook/useProfitScopes'
import AddCostModal from '@components/AddCostModal'
import ProfitTable from './components/ProfitTable'
import { PlusOutlined, SelectOutlined } from '@ant-design/icons'
import { isAdminCheck } from '@utils/helpers'
import { Alert, Button, Card, Select, Space } from 'antd'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'

const ProfitPage = () => {
  const router = useRouter()
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const activeTabKey = useAppSelector((state) => state.profitPage.activeTabKey)

  const { data: currentUser } = useGetCurrentUserQuery()
  const isAdmin = isAdminCheck(currentUser?.roles)

  const [isModalOpen, setIsModalOpen] = useState(false)

  const { domainOptions, companyOptions, isLoading, isError } =
    useProfitScopes()

  const hasAnyScope = domainOptions.length > 0 || companyOptions.length > 0

  const rawActiveScope = useMemo(
    () => decodeProfitScopeKey(activeTabKey),
    [activeTabKey]
  )

  // Carries the display name alongside {type, id} - both ProfitTable (its
  // own edit-modal) and the Add-cost modal below need it to show "what's
  // selected" instead of a domain/company picker (see ActiveScope).
  const activeScope = useMemo(() => {
    if (!rawActiveScope) return null
    const option = [...domainOptions, ...companyOptions].find(
      (opt) => opt.type === rawActiveScope.type && opt.key === rawActiveScope.id
    )
    if (!option) return null
    return {
      type: rawActiveScope.type,
      id: rawActiveScope.id,
      label: option.label,
    }
  }, [rawActiveScope, domainOptions, companyOptions])

  // Falls back to the first domain, then the first company, whenever the
  // stored key does not point at something the user can currently open -
  // on first load, or after their access to the previous scope changed.
  useEffect(() => {
    if (isLoading) return
    const options = [...domainOptions, ...companyOptions]
    const isActiveKeyValid = rawActiveScope
      ? options.some(
          (opt) =>
            opt.type === rawActiveScope.type && opt.key === rawActiveScope.id
        )
      : false
    if (!isActiveKeyValid && options.length > 0) {
      dispatch(
        setActiveTabKey(encodeProfitScopeKey(options[0].type, options[0].key))
      )
    }
  }, [domainOptions, companyOptions, rawActiveScope, isLoading, dispatch])

  const onScopeChange = (key: string) => {
    dispatch(setActiveTabKey(key))
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  if (isError) return <p>{t('profitPage:scope.errorLoading')}</p>
  if (!isLoading && !hasAnyScope) return <p>{t('profitPage:scope.empty')}</p>

  // Grouped so a global admin's (potentially very large) company list stays
  // scannable - a search-select scales to "more companies" far better than a
  // tab strip ever could.
  const selectGroups = [
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
    <FullScreenWrapper unicKey="profit-table">
      <Space
        direction="vertical"
        style={{ width: '100%', position: 'relative' }}
        size="middle"
      >
        <Card
          title={
            <Space wrap>
              <Button type="link" onClick={() => router.push('/profit')}>
                {t('profitPage:title')}
                <SelectOutlined />
              </Button>
              <Select
                value={rawActiveScope ? activeTabKey : undefined}
                onChange={onScopeChange}
                options={selectGroups}
                loading={isLoading}
                showSearch
                optionFilterProp="label"
                placeholder={t('profitPage:scope.placeholder')}
                style={{ minWidth: 260, fontWeight: 'normal' }}
              />
            </Space>
          }
          extra={
            // Domain and company are symmetric scopes on this page - either
            // can log its own expenses. A plain User only ever gets a
            // company into their scope list by administering it themselves
            // (see useProfitScopes - it never widens for a DomainAdmin, let
            // alone a plain User), so reaching a company scope at all already
            // proves ownership; the server re-checks this independently.
            (isAdmin || activeScope?.type === 'company') &&
            activeScope && (
              <Button type="link" onClick={() => setIsModalOpen(true)}>
                <PlusOutlined /> {t('profitPage:addButton')}
              </Button>
            )
          }
        >
          {activeScope ? (
            <ProfitTable key={activeTabKey} scope={activeScope} />
          ) : (
            <Alert type="info" message={t('profitPage:scope.placeholder')} />
          )}
        </Card>
        {isModalOpen && activeScope && (
          <AddCostModal closeModal={closeModal} activeScope={activeScope} />
        )}
      </Space>
    </FullScreenWrapper>
  )
}

export default ProfitPage
