'use client'
/* eslint-disable no-console */
import { setAccount, setActiveDomainId } from '@modules/store/bankSlice'
import { useAppDispatch, useAppSelector } from '@modules/store/hooks'
import DomainBankTab from './components/DomainBankTab/DomainBankTab'
import { useDomainTabs } from '../ProfiitPage/hook/useDomainTabs'
import { ReactNode, useMemo, useEffect, FC } from 'react'
import { useTranslation } from 'next-i18next'
import { Card, Space, Alert, Spin } from 'antd'

interface Props {
  initialSession?: any
}

const BankTransactions: FC<Props> = ({ initialSession }) => {
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
          {activeDomainId && <DomainBankTab domainId={activeDomainId} />}
        </Card>
      )}
    </Space>
  )
}

export default BankTransactions
