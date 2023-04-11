import React, { ReactElement, useState } from 'react'
import { Alert, message, Popconfirm, Table } from 'antd'
import { Modal } from 'antd'
import { Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import PaymentCardHeader from '@common/components/UI/PaymentCardHeader'
import TableCard from '@common/components/UI/TableCard'
import {
  useDeletePaymentMutation,
  useGetAllPaymentsQuery,
} from '@common/api/paymentApi/payment.api'
import { dateToDefaultFormat } from '@common/assets/features/formatDate'
import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import { DeleteOutlined } from '@ant-design/icons'
import { EyeOutlined } from '@ant-design/icons'
import { useGetUserByEmailQuery } from '@common/api/userApi/user.api'
import { AppRoutes, Roles } from '@utils/constants'
import { Tooltip } from 'antd'
import Link from 'next/link'
import { SelectOutlined } from '@ant-design/icons'
import { useRouter } from 'next/router'
import cn from 'classnames'
import { useSession } from 'next-auth/react'
import AddPaymentModal from '@common/components/AddPaymentModal'
import s from './style.module.scss'

const PaymentsBlock = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()
  const [currentPayment, setCurrentPayment] = useState(null)
  const {
    pathname,
    query: { email },
  } = router
  const { data } = useSession()

  const {
    data: currUser,
    isLoading: currUserLoading,
    isFetching: currUserFetching,
    isError: currUserError,
  } = useGetUserByEmailQuery(data?.user?.email, {
    skip: !data?.user?.email,
  })

  const isAdmin = currUser?.data?.role === Roles.ADMIN

  const {
    data: payments,
    isLoading: paymentsLoading,
    isFetching: paymentsFetching,
    isError: paymentsError,
  } = useGetAllPaymentsQuery(
    { limit: pathname === AppRoutes.PAYMENT ? 200 : 5, email: email as string },
    { skip: currUserLoading || !currUser }
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
  const handleEyeClick = (id) => {
    setCurrentPayment(payments.find((item) => item._id === id))
  }
  const handleCloseModal = () => {
    setCurrentPayment(null)
  }

  const columns = [
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      width: '15%',
      ellipsis: true,
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
      width: '10%',
      render: (debit) => debit,
    },
    {
      title: (
        <Tooltip title="Кредит (Оплата)">
          <span>Кредит</span>
        </Tooltip>
      ),
      dataIndex: 'credit',
      key: 'credit',
      width: '10%',
      render: (credit) => credit,
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
          width: '10%',
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
    {
      title: '',
      dataIndex: '',
      width: '10%',
      render: (_, payment: IExtendedPayment) => (
        <div className={s.icon}>
          <Button type="link" onClick={() => handleEyeClick(payment?._id)}>
            <EyeOutlined className={s.icon} />
          </Button>
        </div>
      ),
    },
  ]

  let content: ReactElement

  if (deleteError || paymentsError || currUserError) {
    content = <Alert message="Помилка" type="error" showIcon closable />
  } else {
    content = (
      <Table
        columns={columns}
        dataSource={payments}
        pagination={false}
        bordered
        size="small"
        loading={
          currUserLoading ||
          currUserFetching ||
          paymentsLoading ||
          paymentsFetching
        }
        rowKey="_id"
      />
    )
  }
  const closeModal = () => {
    setIsModalOpen(false)
  }

  return (
    <TableCard
      title={
        email ? (
          <div className={s.block}>
            <span className={s.title}>{`Оплата від користувача ${email}`}</span>
            <Button type="link" onClick={() => setIsModalOpen(true)}>
              <PlusOutlined /> Додати оплату
            </Button>
          </div>
        ) : isAdmin ? (
          <PaymentCardHeader />
        ) : (
          <Link href={AppRoutes.PAYMENT}>
            <a className={s.title}>
              Мої оплати <SelectOutlined />
            </a>
          </Link>
        )
      }
      className={cn({ [s.noScroll]: pathname === AppRoutes.PAYMENT })}
    >
      {currentPayment && (
        <AddPaymentModal
          paymentData={currentPayment}
          edit
          closeModal={handleCloseModal}
        />
        //fgjjgffu
      )}
      {isModalOpen && <AddPaymentModal closeModal={closeModal} />}
      {content}
    </TableCard>
  )
}

export default PaymentsBlock
