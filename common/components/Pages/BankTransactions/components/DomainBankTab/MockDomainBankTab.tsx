import { MOCK_BALANCES, MOCK_DOMAIN, MOCK_TRANSACTIONS } from '@common/api/bankApi/mockBank.api'
import { useAppDispatch } from '@modules/store/hooks'
import { useEffect } from 'react'
import { Card } from 'antd'
import { setAccount } from '@modules/store/bankSlice'
import DomainBankBalance from '../DomainbankBalance/DomainBankBalance'
import TransactionsTable from '../TransactionsTable/TransactionsTable'

const MockDomainBankTab = () => {
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(setAccount(MOCK_BALANCES[0].acc))
  }, [dispatch])

  return (
    <Card styles={{ body: { padding: '3px' } }}>
      <DomainBankBalance balancesData={MOCK_BALANCES} />
      <TransactionsTable
        transactions={MOCK_TRANSACTIONS}
        domain={MOCK_DOMAIN}
        loading={false}
        companies={[]}
      />
    </Card>
  )
}

export default MockDomainBankTab
