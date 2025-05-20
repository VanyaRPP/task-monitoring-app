/* eslint-disable no-console */
'use client'

import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'
import { Button, Card, Divider, Select, Tabs, TabsProps } from 'antd'

import StickyBox from 'react-sticky-box'
import DomainBankTab from './components/DomainBankTab/DomainBankTab'
import DomainBankBalance from './components/DomainbankBalance/DomainBankBalance'

import s from './style.module.scss'

import { IExtendedDomain } from '@common/api/domainApi/domain.api.types'
import { useGetBalancesQuery } from '@common/api/bankApi/bank.api'
import EncryptionService from '@utils/encryptionService'
import { AppRoutes } from '@utils/constants'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

const BankTransactions = () => {
  const router = useRouter()

  const { data: domains = [] } = useGetDomainsQuery({})

  const [selectedDomain, setSelectedDomain] = useState<IExtendedDomain>(
    domains[0]
  )
  const [selectedAcc, setSelectedAcc] = useState('')

  useEffect(() => {
    if (domains?.length > 0) {
      setSelectedDomain(domains[0])
    }
  }, [domains])

  const SECURE_TOKEN = process.env.NEXT_PUBLIC_MONGODB_SECRET_TOKEN
  const encryptionService = new EncryptionService(SECURE_TOKEN)
  const token = selectedDomain?.domainBankToken[0]
    ? encryptionService.decrypt(
        selectedDomain?.domainBankToken[0]?.token ?? 'token'
      )
    : ''

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

  const selectedBalance = balances?.find(
    (balance) => balance.acc === selectedAcc
  )

  useEffect(() => {
    if (balances?.length > 0 && !selectedAcc) {
      setSelectedAcc(balances[0].acc)
    }

  }, [balances])

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
        {balances?.length > 0 && (
          <Select
            placeholder="Оберіть рахунок"
            options={balances?.map((item) => ({
              label: item.acc,
              value: item.acc,
            }))}
            popupMatchSelectWidth={false}
            onSelect={(value) => setSelectedAcc(value)}
          />
        )}
        {selectedBalance && <DomainBankBalance balanceData={selectedBalance} />}
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
