import React, { FC, ReactElement } from 'react'
import { Alert, Card, Spin, Table } from 'antd'
import PaymentCardHeader from '@common/components/UI/PaymentCardHeader'
import PaymentTableSum from '@common/components/UI/PaymentTableSum'
import { columns } from '@utils/mocks'
import TableCard from '@common/components/UI/TableCard'
import { useGetAllPaymentsQuery } from '@common/api/paymentApi/payment.api'
import s from './style.module.scss'

const PaymentsBlock: FC = () => {
  const {
    data: payments,
    isLoading,
    isFetching,
    isError,
  } = useGetAllPaymentsQuery('')

  let content: ReactElement

  if (isLoading || isFetching || !payments) {
    content = <Spin className={s.Spin} />
  } else if (isError) {
    content = <Alert message="Помилка" type="error" showIcon closable />
  } else {
    content = (
      <Table
        className={s.Table}
        columns={columns}
        dataSource={payments}
        pagination={{
          responsive: false,
          size: 'small',
          pageSize: 5,
          position: ['bottomCenter'],
          hideOnSinglePage: true,
        }}
        bordered
        // summary={(pageData) => { //TODO: Use when it will be necessary to display summary info
        //   let totalCredit = 0
        //   let totalDebit = 0

        //   pageData.forEach(({ credit, debit }) => {
        //     totalCredit += credit
        //     totalDebit += debit
        //   })

        //   return (
        //     <PaymentTableSum
        //       totalDebit={totalDebit}
        //       totalCredit={totalCredit}
        //     />
        //   )
        // }}
      />
    )
  }

  return <TableCard title={<PaymentCardHeader />}>{content}</TableCard>
}

export default PaymentsBlock
