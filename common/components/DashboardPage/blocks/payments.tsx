import React, { FC, ReactElement } from 'react'
import { Alert, message, Popconfirm, Spin, Table } from 'antd'
import PaymentCardHeader from '@common/components/UI/PaymentCardHeader'
import TableCard from '@common/components/UI/TableCard'
import {
  useDeletePaymentMutation,
  useGetAllPaymentsQuery,
} from '@common/api/paymentApi/payment.api'
import { dateToDefaultFormat } from '@common/assets/features/formatDate'
import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import { DeleteOutlined } from '@ant-design/icons'
import { useGetUserByEmailQuery } from '@common/api/userApi/user.api'
import { AppRoutes } from '@utils/constants'
import { Tooltip } from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/router'
import cn from 'classnames'
import s from './style.module.scss'

interface Props {
  payments?: IExtendedPayment[]
  isAdmin?: boolean
  isLoading?: boolean
}

const PaymentsBlock: FC<Props> = ({ payments, isAdmin, isLoading }) => {
  const router = useRouter()
  const {
    pathname,
    query: { email },
  } = router

  const {
    data: userResponse,
    isLoading: userLoading,
    isFetching: userFetching,
    isError: userError,
  } = useGetUserByEmailQuery(email as string, {
    skip: !email,
  })
  const {
    data: paymentsByEmail,
    isLoading: paymentsByEmailLoading,
    isFetching: paymentsByEmailFetching,
    isError: paymentsByEmailError,
  } = useGetAllPaymentsQuery(
    {
      limit: 200,
      userId: userResponse?.data._id as string,
    },
    { skip: !email }
  )

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
    userLoading ||
    userFetching ||
    paymentsByEmailLoading ||
    paymentsByEmailFetching ||
    isLoading
  ) {
    content = <Spin className={s.spin} />
  } else if (userError || deleteError || paymentsByEmailError) {
    content = <Alert message="Помилка" type="error" showIcon closable />
  } else {
    content = (
      <Table
        columns={columns}
        dataSource={email ? paymentsByEmail : payments}
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
        ) : pathname === AppRoutes.PAYMENT ? (
          <span className={s.title}>Всі оплати</span>
        ) : isAdmin ? (
          <PaymentCardHeader />
        ) : (
          <Link href={AppRoutes.PAYMENT}>
            <a className={s.title}>Мої оплати</a>
          </Link>
        )
      }
      className={cn({ [s.noScroll]: pathname === AppRoutes.PAYMENT })}
    >
      {content}
    </TableCard>
  )
}

export default PaymentsBlock
