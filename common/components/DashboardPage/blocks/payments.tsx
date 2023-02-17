import React, { FC, ReactElement } from 'react'
import { Alert, Button, message, Spin, Table } from 'antd'
import PaymentCardHeader from '@common/components/UI/PaymentCardHeader'
import TableCard from '@common/components/UI/TableCard'
import {
  useDeletePaymentMutation,
  useGetAllPaymentsQuery,
} from '@common/api/paymentApi/payment.api'
import { dateToDefaultFormat } from '@common/assets/features/formatDate'
import {
  IExtendedPayment,
  IPayment,
} from '@common/api/paymentApi/payment.api.types'
import { DeleteOutlined } from '@ant-design/icons'
import { useGetUserByEmailQuery } from '@common/api/userApi/user.api'
import { useSession } from 'next-auth/react'
import { Roles } from '@utils/constants'
import s from './style.module.scss'

const PaymentsBlock: FC = () => {
  const session = useSession()
  const userResponse = useGetUserByEmailQuery(session?.data?.user?.email)

  const {
    data: payments,
    isLoading,
    isFetching,
    isError,
  } = useGetAllPaymentsQuery('')
  const [deletePayment] = useDeletePaymentMutation()

  const userRole = userResponse?.data?.data?.role

  const handleDeletePayment = async (id: string) => {
    const response = await deletePayment(id)
    if ('data' in response) {
      message.success('Видалено!')
    } else {
      message.error('Помилка при видаленні рахунку')
    }
  }

  const columns = [
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      render: (date) => dateToDefaultFormat(date),
    },
    {
      title: 'Дебет (Реалізація)',
      dataIndex: 'debit',
      key: 'debit',
      width: '20%',
      render: (debit) => (debit === 0 ? null : debit),
    },
    {
      title: 'Кредит (Оплата)',
      dataIndex: 'credit',
      key: 'credit',
      width: '20%',
      render: (credit) => (credit === 0 ? null : credit),
    },
    {
      title: 'Опис',
      dataIndex: 'description',
      key: 'description',
      width: '40%',
      ellipsis: true,
    },
    userRole === Roles.ADMIN
      ? {
          title: '',
          dataIndex: '',
          render: (_, payment: IExtendedPayment) => (
            <Button
              type="link"
              icon={<DeleteOutlined />}
              onClick={() => handleDeletePayment(payment._id)}
            />
          ),
        }
      : { width: '0' },
  ]

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
