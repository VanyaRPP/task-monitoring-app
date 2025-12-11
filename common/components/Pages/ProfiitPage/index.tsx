'use client'

import FullScreenWrapper from '@components/UI/fullScreenTableWrapper/fullScreenTableWrapper'
import { useAppDispatch, useAppSelector } from '@modules/store/hooks'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { setActiveTabKey } from '@modules/store/profitPageSlice'
import { useEffect, useMemo, useState, useCallback } from 'react'
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
  const isAdmin = useMemo(
    () => isAdminCheck(currentUser?.roles),
    [currentUser?.roles]
  )

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

  const onTabChange = useCallback(
    (key: string) => {
      dispatch(setActiveTabKey(key))
    },
    [dispatch]
  )

  const resolvedActiveKey = useMemo(() => {
    if (!tabList.length) return undefined
    const isValid = tabList.some((tab) => tab.key === activeTabKey)
    return isValid ? activeTabKey : tabList[0].key
  }, [tabList, activeTabKey])

  const openModal = useCallback(() => setIsModalOpen(true), [])
  const closeModal = useCallback(() => setIsModalOpen(false), [])

  if (isError) return <p>{t('profitPage:table.parent.errorLoading')}</p>
  if (isLoading && !tabList.length) {
    return (
      <FullScreenWrapper unicKey="profit-table">
        <Card loading />
      </FullScreenWrapper>
    )
  }
  if (!tabList.length) return <p>{t('profitPage:table.parent.noData')}</p>

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
              <Button type="link" onClick={openModal}>
                <PlusOutlined /> {t('profitPage:addButton')}
              </Button>
            )
          }
          tabList={tabList}
          activeTabKey={resolvedActiveKey}
          onTabChange={onTabChange}
          loading={isLoading}
        >
          {resolvedActiveKey && <ProfitTable domainId={resolvedActiveKey} />}
        </Card>
        {isModalOpen && <AddCostModal closeModal={closeModal} />}
      </Space>
    </FullScreenWrapper>
  )
}

export default ProfitPage
