import { IExtendedDomain } from '@common/api/domainApi/domain.api.types'
import TransactionsTable from '../TransactionsTable/TransactionsTable'
import { useGetTransactionsQuery } from '@common/api/bankApi/bank.api'
import { Alert, Card } from 'antd'
import React, { FC } from 'react'

interface Props {
  domain: IExtendedDomain
  token: string
  acc: string
}

const DomainBankTab: FC<Props> = ({ domain, token, acc }) => {
  const { data: transactionsData } = useGetTransactionsQuery(
    { token, acc },
    { skip: !token }
  )

  return (
    <Card>
      {token ? (
        <TransactionsTable transactions={transactionsData} domain={domain} />
      ) : (
        <Alert
          message="Error"
          description="У цього домена немає токена для доступу до транзакцій."
          type="warning"
          showIcon
        />
      )}
    </Card>
  )
}

export default DomainBankTab
