import React, { ReactElement, useState } from 'react'
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

function getDateFilter(value) {
  const [, year, period, number] = value || []
  // TODO: add enums
  if (period === 'quarter') return { quarter: number }
  if (period === 'month') return { month: number }
  if (period === 'year') return { year }
  return {}
}

const PaymentsBlock = () => {
  const router = useRouter()
  const {
    pathname,
    query: { email },
  } = router
  const [currentPayment, setCurrentPayment] = useState<IExtendedPayment>(null)
  const [currentDateFilter, setCurrentDateFilter] = useState()
  const [pageData, setPageData] = useState({
    pageSize: pathname === AppRoutes.PAYMENT ? 10 : 5,
    currentPage: 1,
  })
  const [filters, setFilters] = useState<any>()

  const {
    isFetching: currUserFetching,
    isLoading: currUserLoading,
    isError: currUserError,
    data: currUser,
  } = useGetCurrentUserQuery()

  const {
    isFetching: paymentsFetching,
    isLoading: paymentsLoading,
    isError: paymentsError,
    data: payments,
  } = useGetAllPaymentsQuery(
    {
      skip: (pageData.currentPage - 1) * pageData.pageSize,
      limit: pageData.pageSize,
      email: email as string,
      ...getDateFilter(currentDateFilter),
      companyIds: filters?.company || undefined,
      domainIds: filters?.domain || undefined,
    },
    { skip: currUserLoading || !currUser }
  )

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

  const columns: any = [
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
    columns.unshift({
      title: 'Вулиця',
      dataIndex: 'street',
      render: (i) => `${i?.address} (м. ${i?.city})`,
    })
  }

  if (payments?.currentCompaniesCount > 1) {
    columns.unshift({
      title: 'Компанія',
      dataIndex: 'company',
      filters:
        pathname === AppRoutes.PAYMENT ? payments?.realEstatesFilter : null,
      render: (i) => i?.companyName,
    })
  }

  if (payments?.currentDomainsCount > 1) {
    columns.unshift({
      title: 'Домен',
      dataIndex: 'domain',
      filters: pathname === AppRoutes.PAYMENT ? payments?.domainsFilter : null,
      render: (i) => i.name,
    })
  }

  let content: ReactElement

  if (deleteError || paymentsError || currUserError) {
    content = <Alert message="Помилка" type="error" showIcon closable />
  } else {
    content = (
      <>
        <Table
          columns={columns}
          dataSource={payments?.data}
          pagination={false}
          onChange={(pagination, filters) => {
            setFilters(filters)
          }}
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

        {router.pathname === AppRoutes.PAYMENT &&
          !paymentsLoading &&
          !currUserLoading && (
            <Pagination
              className={s.Pagination}
              pageSize={pageData.pageSize}
              total={payments?.total}
              showSizeChanger
              pageSizeOptions={[10, 30, 50]}
              onChange={(currentPage) => {
                setPageData((ps) => ({ ...ps, currentPage }))
              }}
              onShowSizeChange={(__, pageSize) => {
                setPageData((ps) => ({ ...ps, pageSize, currentPage: 1 }))
              }}
            />
          )}
      </>
    )
  }

  return (
    <TableCard
      title={
        <PaymentCardHeader
          closeEditModal={() => setCurrentPayment(null)}
          setCurrentDateFilter={setCurrentDateFilter}
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
