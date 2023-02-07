import React, { FC } from 'react'
import { Card, Table } from 'antd'
import PaymentCardHeader from '@common/components/UI/PaymentCardHeader'
import PaymentTableSum from '@common/components/UI/PaymentTableSum'
import { columns, dataSource } from '@utils/mocks'
import s from './style.module.scss'

interface Props {
  style: string
}

const PaymentsBlock: FC<Props> = ({ style }) => {
  return (
    <Card
      className={style}
      title={<PaymentCardHeader />}
      style={{ flex: '1.5' }}
    >
      <Table
        className={s.Table}
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        bordered
        summary={(pageData) => {
          let totalCredit = 0
          let totalDebit = 0

          pageData.forEach(({ credit, debit }) => {
            totalCredit += credit
            totalDebit += debit
          })

          return (
            <PaymentTableSum
              totalDebit={totalDebit}
              totalCredit={totalCredit}
            />
          )
        }}
      />
    </Card>
  )
}

export default PaymentsBlock
