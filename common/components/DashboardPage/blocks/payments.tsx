import React, { FC, ReactElement } from 'react'
import { Alert, message, Popconfirm, Spin, Table } from 'antd'
import PaymentCardHeader from '@common/components/UI/PaymentCardHeader'
import TableCard from '@common/components/UI/TableCard'
import {
  useDeletePaymentMutation,
  useGetAllPaymentsQuery,
  useGetPaymentsByEmailQuery,
} from '@common/api/paymentApi/payment.api'
import { dateToDefaultFormat } from '@common/assets/features/formatDate'
import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import { DeleteOutlined } from '@ant-design/icons'
import { useGetUserByEmailQuery } from '@common/api/userApi/user.api'
import { useSession } from 'next-auth/react'
import { AppRoutes, Roles } from '@utils/constants'
import { Tooltip } from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/router'
import cn from 'classnames'
import s from './style.module.scss'

interface Props {
  allPayments?: boolean
}

const PaymentsBlock: FC<Props> = ({ allPayments }) => {
  const { data } = useSession()
  const router = useRouter()
  const {
    query: { email },
  } = router

  const {
    data: userResponse,
    isLoading: userLoading,
    isFetching: userFetching,
    isError: userError,
  } = useGetUserByEmailQuery(data?.user?.email, {
    skip: !data?.user?.email,
  })
  const isAdmin = userResponse?.data?.role === Roles.ADMIN
  const {
    data: payments,
    isLoading: paymentsLoading,
    isFetching: paymentsFetching,
    isError: paymentsError,
  } = useGetAllPaymentsQuery(isAdmin && !allPayments ? 5 : 100)

  const {
    data: byEmailPayments,
    isLoading: byEmailPaymentsLoading,
    isFetching: byEmailPaymentsFetching,
    isError: byEmailPaymentsError,
  } = useGetPaymentsByEmailQuery(email as string, { skip: !email })
  const [deletePayment, { isLoading: deleteLoading, isError: deleteError }] =
    useDeletePaymentMutation()

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
      width: '15%',
      render: (date) => dateToDefaultFormat(date),
    },
    isAdmin && !email
      ? {
          title: 'Платник',
          dataIndex: 'payer',
          key: 'payer',
          width: '15%',
          ellipsis: true,
          render: (payer) => (
            <Link
              href={{
                pathname: AppRoutes.PAYMENT,
                query: { email: payer?.email },
              }}
            >
              <a className={s.payer}>{payer?.email}</a>
            </Link>
          ),
        }
      : { width: '0' },
    {
      title: (
        <Tooltip title="Дебет (Реалізація)">
          <span>Дебет</span>
        </Tooltip>
      ),
      dataIndex: 'debit',
      key: 'debit',
      width: '20%',
      render: (debit) => (debit === 0 ? null : debit),
    },
    {
      title: (
        <Tooltip title="Кредит (Оплата)">
          <span>Кредит</span>
        </Tooltip>
      ),
      dataIndex: 'credit',
      key: 'credit',
      width: '20%',
      render: (credit) => (credit === 0 ? null : credit),
    },
    {
      title: 'Опис',
      dataIndex: 'description',
      key: 'description',
      width: '15%',
      ellipsis: true,
    },
    isAdmin
      ? {
          title: '',
          dataIndex: '',
          width: '15%',
          render: (_, payment: IExtendedPayment) => (
            <div className={s.popconfirm}>
              <Popconfirm
                title={`Ви впевнені що хочете видалити оплату від ${dateToDefaultFormat(
                  payment?.date as unknown as string
                )}?`}
                onConfirm={() => handleDeletePayment(payment?._id)}
                cancelText="Відміна"
                disabled={deleteLoading}
              >
                <DeleteOutlined className={s.icon} />
              </Popconfirm>
            </div>
          ),
        }
      : { width: '0' },
  ]

  let content: ReactElement

  if (
    paymentsLoading ||
    paymentsFetching ||
    byEmailPaymentsLoading ||
    byEmailPaymentsFetching ||
    userLoading ||
    userFetching
  ) {
    content = <Spin className={s.spin} />
  } else if (
    paymentsError ||
    byEmailPaymentsError ||
    userError ||
    deleteError
  ) {
    content = <Alert message="Помилка" type="error" showIcon closable />
  } else {
    content = (
      <Table
        columns={columns}
        dataSource={email ? byEmailPayments : payments}
        pagination={false}
        bordered
        rowKey="_id"
      />
    )
  }

  return (
    <TableCard
      title={
        email ? (
          <span className={s.title}>{`Оплата від користувача ${email}`}</span>
        ) : router.pathname === AppRoutes.PAYMENT ? (
          <span className={s.title}>Оплати</span>
        ) : isAdmin ? (
          <PaymentCardHeader />
        ) : (
          <span className={s.title}>Мої оплати</span>
        )
      }
      className={cn({ [s.noScroll]: email })}
    >
      {content}
    </TableCard>
  )
}

export default PaymentsBlock
