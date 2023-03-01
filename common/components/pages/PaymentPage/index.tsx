import { DeleteOutlined } from '@ant-design/icons'
import {
  useGetAllPaymentsQuery,
  useGetPaymentsByEmailQuery,
} from '@common/api/paymentApi/payment.api'
import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import { dateToDefaultFormat } from '@common/assets/features/formatDate'
import TableCard from '@common/components/UI/TableCard'
import { Alert, Popconfirm, Spin, Table, Tooltip } from 'antd'
import { useRouter } from 'next/router'
import React, { ReactElement } from 'react'
import s from './style.module.scss'

const PaymentPage = () => {
  const {
    query: { email },
  } = useRouter()

  const {
    data: allPayments,
    isLoading: allPaymentsLoading,
    isFetching: allPaymentsFetching,
    isError: allPaymentsError,
  } = useGetAllPaymentsQuery(100, { skip: !!email })
  const {
    data: userPayments,
    isLoading: userPaymentsLoading,
    isFetching: userPaymentsFetching,
    isError: userPaymentsError,
  } = useGetPaymentsByEmailQuery(email as string, {
    skip: !email,
  })

  const columns = [
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      width: '15%',
      render: (date) => dateToDefaultFormat(date),
    },
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
    {
      title: '',
      dataIndex: '',
      width: '15%',
      render: (_, payment: IExtendedPayment) => (
        <div>
          <Popconfirm
            title={`Ви впевнені що хочете видалити оплату від ${dateToDefaultFormat(
              payment.date as unknown as string
            )}?`}
            cancelText="Відміна"
          >
            <DeleteOutlined />
          </Popconfirm>
        </div>
      ),
    },
  ]

  let content: ReactElement

  if (
    allPaymentsLoading ||
    allPaymentsFetching ||
    userPaymentsLoading ||
    userPaymentsFetching
  ) {
    content = <Spin />
  } else if (allPaymentsError || userPaymentsError) {
    content = <Alert message="Помилка" type="error" showIcon closable />
  } else {
    content = (
      <TableCard
        title={email ? `Оплата від користувача ${email}` : 'Оплати'}
        className={s.TableCard}
      >
        <Table
          columns={columns}
          dataSource={allPayments || userPayments}
          pagination={false}
          bordered
        />
      </TableCard>
    )
  }
  return <>{content}</>
}

export default PaymentPage
