'use client'
import { useAppDispatch, useAppSelector } from '@modules/store/hooks'
import { setActiveTabKey } from '@modules/store/profitPageSlice'
import { ReactNode, useEffect, useMemo } from 'react'
import { useDomainTabs } from './hook/useDomainTabs'
import ProfitTable from './components/ProfitTable'
import { Card, Space } from 'antd'

const ProfitPage = () => {
  const dispatch = useAppDispatch()
  const activeTabKey = useAppSelector((state) => state.profitPage.activeTabKey)

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
    return tabList.reduce((acc, domain) => {
      acc[domain.key] = <ProfitTable domainId={domain.key} />
      return acc
    }, {} as Record<string, ReactNode>)
  }, [tabList])

  if (isError) return <p>Failed to load domains.</p>
  if (tabList.length === 0) return <p>No domains available.</p>

  return (
    <Space
      direction="vertical"
      style={{ width: '100%', position: 'relative' }}
      size="middle"
    >
      <Card
        style={{ width: '100%' }}
        title="Profit"
        extra={<>Hello</>}
        tabList={tabList}
        activeTabKey={activeTabKey}
        onTabChange={onTabChange}
        loading={isLoading}
      >
        {contentList[activeTabKey]}
      </Card>
    </Space>
  )
}

export default ProfitPage
