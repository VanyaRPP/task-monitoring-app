import { IExtendedDomain } from '@common/api/domainApi/domain.api.types'
import { Card } from 'antd'

import React, { FC } from 'react'
import TransactionsTable from '../TransactionsTable/TransactionsTable'
import _initial from 'lodash/initial'
import { useGetTransactionsQuery } from '@common/api/bankApi/mockBank.api'
import { Alert } from 'antd'

interface Props {
  domain: IExtendedDomain
  token: string
  acc: string
}



const DomainBankTab: FC<Props> = ({ domain, token, acc }) => {
  console.log("Token:", token);
console.log("Selected Account:", acc);
  const { data: transactionsData, error, isLoading} = useGetTransactionsQuery(
    { token, acc },
    { skip: !token }
  )
  console.log("Transactions Data:", transactionsData);
console.log("Transactions Error:", error);
console.log("Is Transactions Loading:", isLoading);
console.log("Transaction Fields:", Object.keys(transactionsData?.data?.transactions?.[0] || {}));

console.log("Transaction DATE_TIME_DAT_OD_TIM_P:", transactionsData?.data?.transactions.map(t => t.DATE_TIME_DAT_OD_TIM_P));

  return (
    <Card>
      {token ? (
        console.log("Transactions Table Data:", transactionsData?.data?.transactions),
        <TransactionsTable transactions={transactionsData?.data?.transactions ?? []} domain={domain} />
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
