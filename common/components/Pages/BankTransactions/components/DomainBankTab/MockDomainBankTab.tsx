import {
  MOCK_BALANCES,
  MOCK_DOMAIN,
  MOCK_TRANSACTIONS,
} from '@common/api/bankApi/mockBank.api'
import { useGetDomainByPkQuery } from '@common/api/domainApi/domain.api'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { useAppDispatch } from '@modules/store/hooks'
import { FC, useEffect, useMemo } from 'react'
import { Card } from 'antd'
import { setAccount } from '@modules/store/bankSlice'
import DomainBankBalance from '../DomainbankBalance/DomainBankBalance'
import TransactionsTable from '../TransactionsTable/TransactionsTable'

interface Props {
  domainId?: string
}

const MockDomainBankTab: FC<Props> = ({ domainId }) => {
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(setAccount(MOCK_BALANCES[0].acc))
  }, [dispatch])

  // Balances/transactions stay mocked, but resolve the real selected domain and
  // its companies so the company selector shows the picked domain's companies —
  // not the hardcoded MOCK_DOMAIN's. Falls back to MOCK_DOMAIN when no tab is
  // selected yet.
  const { data: selectedDomain } = useGetDomainByPkQuery(
    { domainId: domainId as string },
    { skip: !domainId }
  )
  const domain = selectedDomain ?? MOCK_DOMAIN

  const { data: realEstatesData } = useGetAllRealEstateQuery(
    { domainId: domainId as string },
    { skip: !domainId }
  )
  const companies = useMemo(
    () => realEstatesData?.data || [],
    [realEstatesData]
  )

  return (
    <Card styles={{ body: { padding: '3px' } }}>
      <DomainBankBalance balancesData={MOCK_BALANCES} />
      <TransactionsTable
        transactions={MOCK_TRANSACTIONS}
        domain={domain}
        loading={false}
        companies={companies}
      />
    </Card>
  )
}

export default MockDomainBankTab
