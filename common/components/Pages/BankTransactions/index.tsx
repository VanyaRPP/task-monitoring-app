'use client'
/* eslint-disable no-console */
import { setAccount, setActiveDomainId } from '@modules/store/bankSlice'
import { useAppDispatch, useAppSelector } from '@modules/store/hooks'
import DomainBankTab from './components/DomainBankTab/DomainBankTab'
import MockDomainBankTab from './components/DomainBankTab/MockDomainBankTab'

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_BANK === 'true'
import { useDomainTabs } from '../ProfiitPage/hook/useDomainTabs'
import { ReactNode, useMemo, useEffect } from 'react'
import { useTranslation } from 'next-i18next'
import { Card, Space, Alert, Spin } from 'antd'
import { paymentApi } from '@common/api/paymentApi/payment.api'

const BankTransactions = () => {
  const { t } = useTranslation('bankPage')
  const dispatch = useAppDispatch()
  const activeDomainId = useAppSelector((state) => state.bank.activeDomainId)

  const { tabList, isLoading, isError } = useDomainTabs()

  useEffect(() => {
    const channel = new BroadcastChannel('payments_sync_channel')

    channel.onmessage = (event) => {
      if (event.data === 'PAYMENT_CREATED') {
        dispatch(paymentApi.util.invalidateTags(['Payment']))
      }
    }

    return () => {
      channel.close()
    }
  }, [dispatch])

  useEffect(() => {
    if (tabList.length && !activeDomainId) {
      dispatch(setActiveDomainId(tabList[0].key))
      dispatch(setAccount(null))
    }
  }, [tabList, activeDomainId, dispatch])

  const contentList = useMemo(() => {
    return tabList.reduce(
      (acc, domain) => {
        acc[domain.key] = <DomainBankTab domainId={domain.key} />
        return acc
      },
      {} as Record<string, ReactNode>
    )
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
    <Space
      direction="vertical"
      style={{ width: '100%', position: 'relative' }}
      size="middle"
    >
      {isLoading || tabList.length === 0 ? (
        <div
          style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }}
        >
          <Spin size="large" />
        </div>
      ) : isError ? (
        <Alert
          message={t('errorTitle')}
          description={t('errorDescription')}
          type="error"
          showIcon
        />
      ) : (
        <Card
          title={t('title')}
          tabList={tabList}
          activeTabKey={activeDomainId || tabList[0].key}
          onTabChange={onTabChange}
        >
          {USE_MOCK ? (
            <MockDomainBankTab />
          ) : activeDomainId ? (
            contentList[activeDomainId]
          ) : null}
        </Card>
      )}
    </Space>
  )
}

export default BankTransactions
