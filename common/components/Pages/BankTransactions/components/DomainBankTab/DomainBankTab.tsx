import { EditOutlined, SettingOutlined } from '@ant-design/icons'
import {
  IDomainBankToken,
  IExtendedDomain,
} from '@common/api/domainApi/domain.api.types'
import EncryptionService from '@utils/encryptionService'
import { Card, Input, Row, Divider } from 'antd'

import React, { FC, useEffect, useState } from 'react'
import TransactionsTable from '../TransactionsTable/TransactionsTable'
import CustomPagination from '@components/CustomPagination'
import _initial from 'lodash/initial'
import { useGetTransactionsQuery } from '@common/api/bankApi/bank.api'
import s from './style.module.scss'
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

  const {
    data: transactionsData,
    isLoading,
    error,
  } = useGetTransactionsQuery({ token })

  const onPrevButtonClick = () => {}

  const onNextButtonClick = () => {}

  // const viewTokens = (domainBankToken) => {
  //   return (
  //     <Row
  //       wrap={false}
  //       style={{ overflowX: 'scroll', gap: '1rem', paddingTop: '1rem' }}
  //     >
  //       {domain?.domainBankToken.length
  //         ? domainBankToken.map((token: IDomainBankToken) => {
  //             return (
  //               <Card
  //                 key={token.shortToken}
  //                 size="small"
  //                 title={token.name}
  //                 style={{ width: '300px' }}
  //                 actions={[
  //                   <SettingOutlined key="setting" />,
  //                   <EditOutlined key="edit" />,
  //                 ]}
  //               >
  //                 <Input value={token.shortToken} disabled />
  //               </Card>
  //             )
  //           })
  //         : 'No bank config add token'}
  //     </Row>
  //   )
  // }

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
      {/* <div className={s.tokensContainer}>
        {viewTokens(domain.domainBankToken)}
      </div> */}
      {/* <Divider /> */}

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
