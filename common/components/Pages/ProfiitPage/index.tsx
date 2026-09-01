'use client'

import FullScreenWrapper from '@components/UI/fullScreenTableWrapper/fullScreenTableWrapper'
import { useAppDispatch, useAppSelector } from '@modules/store/hooks'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { setActiveTabKey } from '@modules/store/profitPageSlice'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { useDomainTabs } from './hook/useDomainTabs'
import AddCostModal from '@components/AddCostModal'
import ProfitTable from './components/ProfitTable'
import { PlusOutlined, SelectOutlined } from '@ant-design/icons'
import { isAdminCheck } from '@utils/helpers'
import { Button, Card, Space } from 'antd'
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

  const { tabList, isLoading, isError } = useDomainTabs()

  useEffect(() => {
    if (!isLoading && tabList.length > 0) {
      const isActiveKeyValid = tabList.some((tab) => tab.key === activeTabKey)
      if (!isActiveKeyValid) {
        dispatch(setActiveTabKey(tabList[0].key))
      }
    }
  }, [tabList, isLoading, activeTabKey, dispatch])

  const onTabChange = (key: string) => {
    dispatch(setActiveTabKey(key))
  }

  const contentList = useMemo(() => {
    return tabList.reduce(
      (acc, domain) => {
        // Keyed per domain: without it React reuses one ProfitTable instance
        // across tabs, so the dashboard keeps the previously selected period
        // and renders empty until its effect catches up.
        acc[domain.key] = <ProfitTable key={domain.key} domainId={domain.key} />
        return acc
      },
      {} as Record<string, ReactNode>
    )
  }, [tabList])

  const closeModal = () => {
    setIsModalOpen(false)
  }

  if (isError) return <p>{t('profitPage:table.parent.errorLoading')}</p>
  if (tabList.length === 0) return <p>{t('profitPage:table.parent.noData')}</p>

  return (
    <FullScreenWrapper unicKey="profit-table">
      <Space
        direction="vertical"
        style={{ width: '100%', position: 'relative' }}
        size="middle"
      >
        <Card
          title={
            <Button type="link" onClick={() => router.push('/profit')}>
              {t('profitPage:title')}
              <SelectOutlined />
            </Button>
          }
          extra={
            isAdmin && (
              <Button type="link" onClick={() => setIsModalOpen(true)}>
                <PlusOutlined /> {t('profitPage:addButton')}
              </Button>
            )
          }
          tabList={tabList}
          activeTabKey={activeTabKey}
          onTabChange={onTabChange}
          loading={isLoading}
        >
          {contentList[activeTabKey]}
        </Card>
        {isModalOpen && (
          <AddCostModal closeModal={closeModal} activeDomain={activeTabKey} />
        )}
      </Space>
    </FullScreenWrapper>
  )
}

export default ProfitPage
