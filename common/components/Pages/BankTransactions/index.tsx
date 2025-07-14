'use client'
/* eslint-disable no-console */
import FullScreenWrapper from '@components/UI/fullScreenTableWrapper/fullScreenTableWrapper'
import { setAccount, setActiveDomainId } from '@modules/store/bankSlice'
import { useAppDispatch, useAppSelector } from '@modules/store/hooks'
import DomainBankTab from './components/DomainBankTab/DomainBankTab'
import { useDomainTabs } from '../ProfiitPage/hook/useDomainTabs'
import { ReactNode, useMemo, useEffect } from 'react'
import { useTranslation } from 'next-i18next'
import { Card, Space, Alert } from 'antd'

const BankTransactions = () => {
  const { t } = useTranslation('bankPage')
  const dispatch = useAppDispatch()
  const activeDomainId = useAppSelector((state) => state.bank.activeDomainId)

  const { tabList, isLoading, isError } = useDomainTabs()

  useEffect(() => {
    if (tabList.length && !activeDomainId) {
      dispatch(setActiveDomainId(tabList[0].key))
      dispatch(setAccount(null))
    }
  }, [tabList, activeDomainId, dispatch])

  const contentList = useMemo(() => {
    return tabList.reduce((acc, domain) => {
      acc[domain.key] = <DomainBankTab domainId={domain.key} />
      return acc
    }, {} as Record<string, ReactNode>)
  }, [tabList])

  const onTabChange = (key: string) => {
    dispatch(setActiveDomainId(key))
  }

  if (isError) {
    return (
      <Alert
        message={t('errorTitle')}
        description={t('errorDescription')}
        type="error"
        showIcon
      />
    )
  }

  return (
    <FullScreenWrapper unicKey="bank-table">
      <Space
        direction="vertical"
        style={{ width: '100%', position: 'relative' }}
        size="middle"
      >
        {tabList.length > 0 ? (
          <Card
            title={t('title')}
            tabList={tabList}
            activeTabKey={activeDomainId || tabList[0].key}
            onTabChange={onTabChange}
            loading={isLoading}
          >
            {activeDomainId ? contentList[activeDomainId] : null}
          </Card>
        ) : (
          <Alert
            message={t('noDomains')}
            description={t('noDomainsDescription')}
            type="info"
            showIcon
          />
        )}
      </Space>
    </FullScreenWrapper>
  )
}

export default BankTransactions
