import { EditOutlined, SettingOutlined } from '@ant-design/icons'
import {
  IDomainBankToken,
  IExtendedDomain,
} from '@common/api/domainApi/domain.api.types'
import EncryptionService from '@utils/encryptionService'
import { Card, Input, Row, Carousel, Divider } from 'antd'

import React, { FC, useEffect, useState } from 'react'
import TransactionsTable from '../TransactionsTable/TransactionsTable'
import CustomPagination from '@components/CustomPagination'
import _initial from 'lodash/initial'

import {
  // useGetBalancesQuery,
  // useGetDateQuery,
  useLazyGetTransactionsQuery,
} from '@common/api/bankApi/bank.api'
// import DomainBankBalance from '../DomainbankBalance/DomainBankBalance'
import s from './style.module.scss'

interface Props {
  domain: IExtendedDomain
}

const DomainBankTab: FC<Props> = ({ domain }) => {
  // const { Meta } = Card
  // const { TextArea } = Input

  const SECURE_TOKEN = process.env.NEXT_PUBLIC_MONGODB_SECRET_TOKEN

  const encryptionService = new EncryptionService(SECURE_TOKEN)

  const token = domain?.domainBankToken[0]
    ? encryptionService.decrypt(domain?.domainBankToken[0]?.token ?? 'token')
    : ''

  const [limit, setLimit] = useState(25)
  const [pageIds, setPageIds] = useState<string[]>([])

  const pageSizeOptions = [
    { label: '25', value: 25 },
    { label: '50', value: 50 },
    { label: '100', value: 100 },
  ]

  const [getNextTransactions, { data: transactionsData }] =
    useLazyGetTransactionsQuery()

  useEffect(() => {
    token && getNextTransactions({ token, limit, followId: pageIds.at(-1) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, limit])

  const onPrevButtonClick = () => {
    setPageIds((prev) => _initial(prev))
    getNextTransactions({
      token,
      limit,
      followId: pageIds.at(-2),
    })
  }

  const onNextButtonClick = () => {
    setPageIds((prev) => [...prev, transactionsData.next_page_id])
    getNextTransactions({
      token,
      limit,
      followId: transactionsData.next_page_id,
    })
  }

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
      {/* <div className={s.cardStyle}>
        <div className={s.leftContainer}>
          <div className={s.metaStyle}>
            <Meta
              title={domain.name}
              description={
                <TextArea
                  value={domain.description}
                  disabled
                  autoSize={{ minRows: 1, maxRows: 4 }}
                />
              }
            />
          </div>
          <div className={s.tokensContainer}>
            {viewTokens(domain.domainBankToken)}
          </div>
        </div>

        <div className={s.carouselStyle}>
          <Card>
            <Carousel arrows infinite={false}>
              {balancesData?.data?.balances?.map((balance, index) => (
                <DomainBankBalance key={balance.acc} balanceData={balance} />
              ))}
            </Carousel>
          </Card>
        </div>
      </div>

      <Divider /> */}
      <div className={s.tokensContainer}>
        {viewTokens(domain.domainBankToken)}
      </div>
      <Divider />
      <TransactionsTable
        transactions={transactionsData?.transactions}
        pagination={
          <CustomPagination
            selectOptions={pageSizeOptions}
            selectValue={limit}
            onSelectChange={(e) => setLimit(e)}
            onPrevButtonClick={onPrevButtonClick}
            onNextButtonClick={onNextButtonClick}
            prevButtonDisabled={!pageIds.at(-1)}
            nextButtonDisabled={!transactionsData?.exist_next_page}
            prevButtonText="Prev"
            nextButtonText="Next"
          />
        }
        domain={domain}
      />
    </Card>
  )
}

export default DomainBankTab
