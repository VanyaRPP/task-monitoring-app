/* eslint-disable no-console */
'use client'

import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'
import { Card, Tabs, TabsProps } from 'antd'

import StickyBox from 'react-sticky-box'
import DomainBankTab from './components/DomainBankTab/DomainBankTab'

const BankTransactions = () => {
  const {
    data: domains = [],
    isLoading: isDomainsLoading,
    isError: isDomainsError,
  } = useGetDomainsQuery({})

  const items = domains.map((_, i) => {
    return {
      label: _.name,
      key: _._id,
      children: <DomainBankTab domain={_} />,
    }
  })

  const renderTabBar: TabsProps['renderTabBar'] = (props, DefaultTabBar) => (
    <StickyBox style={{ zIndex: 1 }}>
      <DefaultTabBar {...props} />
    </StickyBox>
  )

  return (
    <Card>
      <Tabs defaultActiveKey="1" renderTabBar={renderTabBar} items={items} />
    </Card>
  )
}

export default BankTransactions
