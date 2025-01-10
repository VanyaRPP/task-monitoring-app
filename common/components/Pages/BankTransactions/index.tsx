/* eslint-disable no-console */
'use client'

import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'
import { Button, Card, Select, Tabs, TabsProps } from 'antd'

import StickyBox from 'react-sticky-box'
import DomainBankTab from './components/DomainBankTab/DomainBankTab'

import s from './style.module.scss'
import { useRouter } from 'next/router'
import { AppRoutes } from '@utils/constants'
import { useGetBalancesQuery } from '@common/api/bankApi/bank.api'
import { useState } from 'react'
import { IExtendedDomain } from '@common/api/domainApi/domain.api.types'
import EncryptionService from '@utils/encryptionService'

const BankTransactions = () => {
  const router = useRouter()

  const [selectedDomain, setSelectedDomain] = useState<IExtendedDomain>()
  const [selectedAcc, setSelectedAcc] = useState('')

  const SECURE_TOKEN = process.env.NEXT_PUBLIC_MONGODB_SECRET_TOKEN
  const encryptionService = new EncryptionService(SECURE_TOKEN)
  const token = selectedDomain?.domainBankToken[0]
    ? encryptionService.decrypt(
        selectedDomain?.domainBankToken[0]?.token ?? 'token'
      )
    : ''

  const { data: domains = [] } = useGetDomainsQuery({})
  const { data: balances } = useGetBalancesQuery({ token }, { skip: !token })

  const items = domains.map((domain) => {
    return {
      label: domain.name,
      key: domain._id,
      children: (
        <DomainBankTab domain={domain} token={token} acc={selectedAcc} />
      ),
    }
  })

  const renderTabBar: TabsProps['renderTabBar'] = (props, DefaultTabBar) => (
    <StickyBox className={s.tableHeader}>
      <div className={s.filterWrapper}>
        <Button
          type="link"
          onClick={() => {
            router.push(AppRoutes.BANKTEST)
          }}
        >
          Банк
        </Button>
        {balances && (
          <Select
            placeholder="Оберіть рахунок"
            options={balances.map((item) => ({
              label: item.acc,
              value: item.acc,
            }))}
            popupMatchSelectWidth={false}
            onSelect={(value) => setSelectedAcc(value)}
          />
        )}
      </div>
      <DefaultTabBar {...props} className={s.tabBar} />
    </StickyBox>
  )

  return (
    <Card>
      <Tabs
        defaultActiveKey="1"
        renderTabBar={renderTabBar}
        items={items}
        onChange={(id) =>
          setSelectedDomain(domains.find((domain) => domain._id === id))
        }
      />
    </Card>
  )
}

export default BankTransactions
