import {
  useGetTransactionsQuery,
  useGetBalancesQuery,
} from '@common/api/bankApi/bank.api'
import { useGetDomainByPkQuery } from '@common/api/domainApi/domain.api'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import TransactionsTable from '../TransactionsTable/TransactionsTable'
import { useAppDispatch, useAppSelector } from '@modules/store/hooks'
import { FC, useEffect, useMemo } from 'react'
import { Alert, Card, Spin } from 'antd'
import { useTranslation } from 'next-i18next'
import { setAccount } from '@modules/store/bankSlice'
import DomainBankBalance from '../DomainbankBalance/DomainBankBalance'

interface Props {
  domainId: string
}

const DomainBankTab: FC<Props> = ({ domainId }) => {
  const { t } = useTranslation('bankPage')
  const dispatch = useAppDispatch()
  const selectedAccount = useAppSelector((state) => state.bank.account)

  const {
    data: domain,
    isLoading: isDomainLoading,
    isError: isDomainError,
  } = useGetDomainByPkQuery({ domainId }, { skip: !domainId })

  // The token itself stays on the server; the bank routes use it by domainId.
  const hasBankToken = Boolean(domain?.domainBankToken?.length)

  const {
    data: balances,
    isLoading: isBalancesLoading,
    isError: isBalancesError,
  } = useGetBalancesQuery({ domainId }, { skip: !hasBankToken })

  useEffect(() => {
    if (balances?.length && domain?.iban) {
      const matched = balances.find((b) => b.acc === domain.iban)
      dispatch(setAccount(matched?.acc ?? balances[0].acc))
    }
  }, [balances, domainId, domain?.iban, dispatch])

  const {
    data: transactionsData,
    isLoading: isTransactionsLoading,
    refetch: refetchTransactions,
  } = useGetTransactionsQuery(
    {
      acc: selectedAccount ?? undefined,
      domainId,
    },
    { skip: !hasBankToken || !selectedAccount }
  )

  const { data: realEstatesData } = useGetAllRealEstateQuery({
    domainId,
  })

  const companies = useMemo(
    () => realEstatesData?.data || [],
    [realEstatesData]
  )

  const enrichedTransactions = useMemo(() => {
    if (!transactionsData?.length) return transactionsData

    const osndToCompanyId = new Map<string, string>()
    for (const tx of transactionsData) {
      const isTransit = tx.AUT_CNTR_NAM?.includes('Транз')
      if (isTransit && tx.OSND && tx.previousCompanyId) {
        osndToCompanyId.set(tx.OSND, tx.previousCompanyId)
      }
    }

    if (!osndToCompanyId.size) return transactionsData

    return transactionsData.map((tx) => {
      const isTransit = tx.AUT_CNTR_NAM?.includes('Транз')
      if (isTransit && tx.OSND && !tx.previousCompanyId) {
        const companyId = osndToCompanyId.get(tx.OSND)
        if (companyId) return { ...tx, previousCompanyId: companyId }
      }
      return tx
    })
  }, [transactionsData])

  if (isDomainLoading || !domain) {
    return (
      <div
        style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}
      >
        <Spin size="large" />
      </div>
    )
  }

  if (isDomainError) {
    return (
      <Alert
        message={t('domainErrorTitle')}
        description={t('domainErrorDescription')}
        type="error"
        showIcon
      />
    )
  }

  if (isBalancesError || !balances?.length) {
    return (
      <Alert
        message={t('balanceErrorTitle')}
        description={t('balanceErrorDescription')}
        type="warning"
        showIcon
      />
    )
  }

  return (
    <Card
      styles={{ body: { padding: '3px' } }}
      loading={isDomainLoading || isBalancesLoading}
    >
      {hasBankToken ? (
        <>
          <DomainBankBalance balancesData={balances} />
          <TransactionsTable
            transactions={enrichedTransactions}
            domain={domain}
            loading={isTransactionsLoading}
            companies={companies}
            refetchTransactions={refetchTransactions}
          />
        </>
      ) : (
        <Alert
          message={t('tokenOrAccMissingTitle')}
          description={t('tokenOrAccMissingDescription')}
          type="warning"
          showIcon
        />
      )}
    </Card>
  )
}

export default DomainBankTab
