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
import { useSession } from 'next-auth/react'
import { Roles } from '@utils/constants'
import { Tooltip } from 'antd'
import s from './style.module.scss'

const PaymentsBlock: FC = () => {
  const { data } = useSession()
  // const { data: userResponse, isError: userError } = useGetUserByEmailQuery(
  //   data?.user?.email
  // )

  const {
    data: payments,
    isLoading,
    isFetching,
    isError,
  } = useGetAllPaymentsQuery('')
  const [deletePayment] = useDeletePaymentMutation()

  // const isAdmin = userResponse?.data?.role === Roles.ADMIN

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
    {
      title: 'Платник',
      dataIndex: 'payer',
      key: 'payer',
      width: '15%',
      ellipsis: true,
      render: (payer) => payer.email,
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
  ]
  // const columns = [
  //   {
  //     title: 'Дата',
  //     dataIndex: 'date',
  //     key: 'date',
  //     width: '15%',
  //     render: (date) => dateToDefaultFormat(date),
  //   },
  //   isAdmin
  //     ? {
  //         title: 'Платник',
  //         dataIndex: 'payer',
  //         key: 'payer',
  //         width: '15%',
  //         ellipsis: true,
  //         render: (payer) => payer.email,
  //       }
  //     : { width: '0' },
  //   {
  //     title: (
  //       <Tooltip title="Дебет (Реалізація)">
  //         <span>Дебет</span>
  //       </Tooltip>
  //     ),
  //     dataIndex: 'debit',
  //     key: 'debit',
  //     width: '20%',
  //     render: (debit) => (debit === 0 ? null : debit),
  //   },
  //   {
  //     title: (
  //       <Tooltip title="Кредит (Оплата)">
  //         <span>Кредит</span>
  //       </Tooltip>
  //     ),
  //     dataIndex: 'credit',
  //     key: 'credit',
  //     width: '20%',
  //     render: (credit) => (credit === 0 ? null : credit),
  //   },
  //   {
  //     title: 'Опис',
  //     dataIndex: 'description',
  //     key: 'description',
  //     width: '15%',
  //     ellipsis: true,
  //   },
  //   isAdmin
  //     ? {
  //         title: '',
  //         dataIndex: '',
  //         width: '15%',
  //         render: (_, payment: IExtendedPayment) => (
  //           <div className={s.Popconfirm}>
  //             <Popconfirm
  //               title={`Ви впевнені що хочете видалити оплату від ${dateToDefaultFormat(
  //                 payment.date as unknown as string
  //               )}?`}
  //               onConfirm={() => handleDeletePayment(payment._id)}
  //               cancelText="Відміна"
  //             >
  //               <DeleteOutlined className={s.Icon} />
  //             </Popconfirm>
  //           </div>
  //         ),
  //       }
  //     : { width: '0' },
  // ]

  let content: ReactElement

  if (isLoading || isFetching || !payments) {
    content = <Spin className={s.Spin} />
  } else if (isError) {
    content = <Alert message="Помилка" type="error" showIcon closable />
  } else {
    content = (
      <Table
        columns={columns}
        dataSource={payments}
        bordered
        pagination={false}
        rowKey="_id"
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
  return <>{content}</>
  // return <TableCard title={<PaymentCardHeader />}>{content}</TableCard>
}

export default PaymentsBlock
