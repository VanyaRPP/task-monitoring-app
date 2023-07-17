import React, { ReactElement, useState, useEffect, Fragment } from 'react'
import { Alert, message, Pagination, Popconfirm, Table } from 'antd'
import { Button } from 'antd'
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
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { AppRoutes, Operations, Roles, paymentsTitle } from '@utils/constants'
import { Tooltip } from 'antd'
import { useRouter } from 'next/router'
import cn from 'classnames'
import s from './style.module.scss'

const PaymentsBlock = () => {
  const router = useRouter()
  const [currentPayment, setCurrentPayment] = useState<IExtendedPayment>(null)
  const [page, setPage] = useState({
    data: [],
    currentPage: 1,
    pageSize : 10,
    totalPage: 0,
    minIndex: 0,
    maxIndex: 0,
    loading: true,
  })
  const {
    pathname,
    query: { email },
  } = router

  const {
    data: currUser,
    isLoading: currUserLoading,
    isFetching: currUserFetching,
    isError: currUserError,
  } = useGetCurrentUserQuery()

  const {
    data: payments,
    isLoading: paymentsLoading,
    isFetching: paymentsFetching,
    isError: paymentsError,
  } = useGetAllPaymentsQuery(
    { limit: pathname === AppRoutes.PAYMENT ? 200 : 5, email: email as string },
    { skip: currUserLoading || !currUser }
  )
  // eslint-disable-next-line no-console
  console.log(payments)
  
  useEffect(() => {
    if(!paymentsLoading && !paymentsError)
    {
      setPage((prevState)=>({
        ...prevState,
        data: payments,
        totalPage: Math.ceil(payments?.length / prevState.pageSize),
        minIndex: 0,
        maxIndex: prevState.pageSize,
        loading: false,
      }))
    }
  }, [payments])
  

  const [deletePayment, { isLoading: deleteLoading, isError: deleteError }] =
    useDeletePaymentMutation()

  const isGlobalAdmin = currUser?.roles?.includes(Roles.GLOBAL_ADMIN)

  const handleDeletePayment = async (id: string) => {
    const response = await deletePayment(id)
    if ('data' in response) {
      message.success('Видалено!')
    } else {
      message.error('Помилка при видаленні рахунку')
    }
  }

  const invoiceTypes = Object.keys(paymentsTitle)

  const paymentsPageColumns =
    router.pathname === AppRoutes.PAYMENT
      ? [
          ...invoiceTypes.map((type) => ({
            title: paymentsTitle[type],
            dataIndex: 'invoice',
            render: (invoice) => {
              const item = invoice.find((item) => item.type === type)
              return item ? item.sum : <span className={s.currency}>-</span>
            },
          })),
        ]
      : []

  // currentCompaniesCount, currentDomainsCount done, just use it
  const columns = [
    {
      title: 'Домен',
      dataIndex: 'domain',
      render: (i) => i.name,
    },
    {
      title: 'Компанія',
      dataIndex: 'company',
      render: (i) => i.companyName,
    },
    {
      title: 'Дата',
      dataIndex: 'date',
      ellipsis: true,
      render: dateToDefaultFormat,
    },
    {
      title: (
        <Tooltip title="Дебет (Реалізація)">
          <span>Дебет</span>
        </Tooltip>
      ),
      dataIndex: 'debit',
      render: (_, payment: IExtendedPayment) => {
        if (payment.type === Operations.Debit) {
          return renderCurrency(payment.generalSum)
        }
        return <span className={s.currency}>-</span>
      },
    },
    {
      title: (
        <Tooltip title="Кредит (Оплата)">
          <span>Кредит</span>
        </Tooltip>
      ),
      dataIndex: 'credit',
      render: (_, payment: IExtendedPayment) => {
        if (payment.type === Operations.Credit) {
          return renderCurrency(payment.generalSum)
        }
        return <span className={s.currency}>-</span>
      },
    },
    {
      title: 'Опис',
      dataIndex: 'description',
    },
    ...paymentsPageColumns,
    isGlobalAdmin
      ? {
          title: '',
          dataIndex: '',
          width: router.pathname === AppRoutes.PAYMENT ? '5%' : '10%',
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
      width: router.pathname === AppRoutes.PAYMENT ? '5%' : '10%',
      render: (_, payment: IExtendedPayment) => (
        <div className={s.eyelined}>
          <Button
            type="link"
            onClick={() => {
              setCurrentPayment(payment)
            }}
          >
            <EyeOutlined className={s.eyelined} />
          </Button>
        </div>
      ),
    },
  ]

  if (isGlobalAdmin && !email) {
    columns.unshift(
      {
        title: 'Компанія',
        dataIndex: 'company',
        render: (i) => i?.companyName,
      },
      {
        title: 'Вулиця',
        dataIndex: 'street',
        render: (i) => `${i?.address} (м. ${i?.city})`,
      }
    )
  }
  let content: ReactElement
  
  const handlePaginationChange = (page: number, pageSize: number) => {
    setPage((prevState) => ({
      ...prevState,
      currentPage: page,
      minIndex: (page - 1) * pageSize,
      maxIndex: page * pageSize,
    }));
  };

  const { data, currentPage, pageSize, minIndex, maxIndex } = page;
  
  if (deleteError || paymentsError || currUserError) {
    content = <Alert message="Помилка" type="error" showIcon closable />
  } else {
    content = (
      <Fragment>
       <Table
        columns={columns}
        dataSource={payments?.slice(minIndex, maxIndex)}
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

      <Pagination
          className={s.Pagination}
          current={page.currentPage}
          pageSize={page.pageSize}
          total={payments?.length}
          showSizeChanger
          pageSizeOptions={[10, 30, 50]}
          onChange={handlePaginationChange}
          onShowSizeChange={(current,size) => {
            setPage((prevPage) => ({ ...prevPage, pageSize: size }));
        }}
      />
    </Fragment> 
  )
  }

  return (
    <TableCard
      title={
        <PaymentCardHeader
          closeEditModal={() => setCurrentPayment(null)}
          currentPayment={currentPayment}
        />
      }
      className={cn({ [s.noScroll]: pathname === AppRoutes.PAYMENT })}
    >
      {content}
    </TableCard>
  )
}

// TODO: move to common helpers
export function renderCurrency(number) {
  return (
    <div className={s.currency}>
      {number ? new Intl.NumberFormat('en-EN').format(number) : '-'}
    </div>
  )
}

export default PaymentsBlock
