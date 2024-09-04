import { EditOutlined, SettingOutlined } from '@ant-design/icons'
import {
  IDomainBankToken,
  IExtendedDomain,
} from '@common/api/domainApi/domain.api.types'
import EncryptionService from '@utils/encryptionService'
import { Button, Card, Input, Row } from 'antd'

import React, { FC, useEffect, useState } from 'react'
import TransactionsTable from '../TransactionsTable/TransactionsTable'
import {
  useGetTransactionsQuery,
  useGetDateQuery,
  useGetBalancesQuery,
} from '@common/api/bankApi/bank.api'

interface Props {
  domain: IExtendedDomain
}

const DomainBankTab: FC<Props> = ({ domain }) => {
  const { Meta } = Card
  const { TextArea } = Input

  const SECURE_TOKEN = process.env.NEXT_PUBLIC_MONGODB_SECRET_TOKEN

  const encryptionService = new EncryptionService(SECURE_TOKEN)

  const token = domain?.domainBankToken[0]
    ? encryptionService.decrypt(domain?.domainBankToken[0]?.token)
    : ''

  const [tr, setTr] = useState([])

  const {
    data: transactionsData,
    error: transactionsError,
    isLoading: transactionsLoading,
  } = useGetTransactionsQuery(
    { token },
    {
      skip: !token,
    }
  )

  const {
    data: balancesData,
    error: balancesError,
    isLoading: balancesLoading,
  } = useGetBalancesQuery(
    { token },
    {
      skip: !token,
    }
  )

  useEffect(() => {
    if (
      !transactionsLoading &&
      transactionsData &&
      transactionsData.data.transactions
    ) {
      setTr(transactionsData.data.transactions)
    }
  }, [transactionsLoading, transactionsData])

  const {
    data: dateData,
    error: dateError,
    isLoading: dateLoading,
  } = useGetDateQuery(
    { token },
    {
      skip: !token,
    }
  )

  const viewTokens = (domainBankToken) => {
    return (
      <Row
        wrap={false}
        style={{ overflowX: 'scroll', gap: '1rem', paddingTop: '1rem' }}
      >
        {domain?.domainBankToken.length
          ? domainBankToken.map((token: IDomainBankToken) => {
              return (
                <Card
                  key={token.shortToken}
                  size="small"
                  title={token.name}
                  style={{ width: '300px' }}
                  actions={[
                    <SettingOutlined key="setting" />,
                    <EditOutlined key="edit" />,
                  ]}
                >
                  <Input value={token.shortToken} disabled />
                </Card>
              )
            })
          : 'No bank config add token'}
      </Row>
    )
  }

  return (
    <Card>
      <Meta
        title={domain.name}
        description={<TextArea rows={4} value={domain.description} disabled />}
      />
      {viewTokens(domain.domainBankToken)}

      <Button onClick={() => console.log(dateData)}>date</Button>
      <Button onClick={() => console.log(balancesData)}>balances</Button>

      <br />
      <TransactionsTable transactions={tr} />
    </Card>
  )
}

export default DomainBankTab
