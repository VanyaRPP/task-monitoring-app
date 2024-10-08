import { IExtendedDomain } from '@common/api/domainApi/domain.api.types'
import EncryptionService from '@utils/encryptionService'
import { Card } from 'antd'

import React, { FC } from 'react'
import TransactionsTable from '../TransactionsTable/TransactionsTable'
import CustomPagination from '@components/CustomPagination'
import _initial from 'lodash/initial'
import { useGetTransactionsQuery } from '@common/api/bankApi/bank.api'
import { Alert } from 'antd'

interface Props {
  domain: IExtendedDomain
}

const DomainBankTab: FC<Props> = ({ domain }) => {
  const SECURE_TOKEN = process.env.NEXT_PUBLIC_MONGODB_SECRET_TOKEN

  const encryptionService = new EncryptionService(SECURE_TOKEN)

  const token = domain?.domainBankToken[0]
    ? encryptionService.decrypt(domain?.domainBankToken[0]?.token ?? 'token')
    : ''

  const { data: transactionsData } = useGetTransactionsQuery({ token })

  const onPrevButtonClick = () => {}

  const onNextButtonClick = () => {}

  return (
    <Card>
      {token ? (
        <TransactionsTable
          transactions={transactionsData}
          pagination={
            <CustomPagination prevButtonText="Prev" nextButtonText="Next" />
          }
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
