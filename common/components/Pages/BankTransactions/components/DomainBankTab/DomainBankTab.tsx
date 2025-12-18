import {
  useGetTransactionsQuery,
  useGetBalancesQuery,
} from '@common/api/bankApi/bank.api'
import { useGetDomainByPkQuery } from '@common/api/domainApi/domain.api'
import TransactionsTable from '../TransactionsTable/TransactionsTable'
import { useAppDispatch, useAppSelector } from '@modules/store/hooks'
import EncryptionService from '@utils/encryptionService'
import { FC, useEffect, useMemo, useState } from 'react'
import { Alert, Card, Spin } from 'antd'
import { useTranslation } from 'next-i18next'
import { setAccount } from '@modules/store/bankSlice'
import DomainBankBalance from '../DomainbankBalance/DomainBankBalance'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { useSearchStreetsQuery } from '@common/api/streetApi/street.api'

interface Props {
  domainId: string
}

const SECURE_TOKEN = process.env.NEXT_PUBLIC_MONGODB_SECRET_TOKEN

const DomainBankTab: FC<Props> = ({ domainId }) => {
  const { t } = useTranslation('bankPage')
  const dispatch = useAppDispatch()
  const selectedAccount = useAppSelector((state) => state.bank.account)

  const encryptionService = useMemo(
    () => new EncryptionService(SECURE_TOKEN),
    []
  )

  const {
    data: domain,
    isLoading: isDomainLoading,
    isError: isDomainError,
  } = useGetDomainByPkQuery({ domainId }, { skip: !domainId })

  const decryptedToken = useMemo(() => {
    const encrypted = domain?.domainBankToken?.[0]?.token
    return encrypted ? encryptionService.decrypt(encrypted) : ''
  }, [domain, encryptionService])

  const {
    data: balances,
    isLoading: isBalancesLoading,
    isError: isBalancesError,
  } = useGetBalancesQuery(
    { token: decryptedToken },
    { skip: !decryptedToken || decryptedToken.length === 0 }
  )

  useEffect(() => {
    if (balances?.length && domain?.iban) {
      const matched = balances.find((b) => b.acc === domain.iban)
      if (selectedAccount !== (matched?.acc ?? balances[0].acc)) {
        dispatch(setAccount(matched?.acc ?? balances[0].acc))
      }
    }
  }, [balances, domain?.iban, dispatch, selectedAccount])

  const shouldSkipTransactions = !decryptedToken || !selectedAccount

  const { data: transactionsData, isLoading: isTransactionsLoading } =
    useGetTransactionsQuery(
      { token: decryptedToken, acc: selectedAccount ?? '' },
      { skip: shouldSkipTransactions }
    )

  const { data: realEstatesData } = useGetAllRealEstateQuery(
    { domainId },
    { skip: !domainId }
  )
  const companies = useMemo(
    () => realEstatesData?.data || [],
    [realEstatesData]
  )

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
      {decryptedToken ? (
        <>
          <DomainBankBalance balancesData={balances} />
          <TransactionsTable
            transactions={transactionsData}
            domain={domain}
            loading={isTransactionsLoading}
            companies={companies}
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
