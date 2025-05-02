import { IExtendedDomain } from '@common/api/domainApi/domain.api.types'
import { Card } from 'antd'

import React, { FC } from 'react'
import TransactionsTable from '../TransactionsTable/TransactionsTable'
import _initial from 'lodash/initial'
// import { useGetTransactionsQuery } from '@common/api/bankApi/mockBank.api'
import { useGetTransactionsQuery } from '@common/api/bankApi/bank.api'
import { Alert } from 'antd'

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
        <TransactionsTable
          transactions={transactionsData}
          // transactions={transactionsData?.data?.transactions ?? []}
          domain={domain}
        />
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
