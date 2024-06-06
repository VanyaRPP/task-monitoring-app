import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons'
import {
  useDeletePaymentMutation,
  useGetAllPaymentsQuery,
} from '@common/api/paymentApi/payment.api'
import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { dateToDefaultFormat } from '@common/assets/features/formatDate'
import PaymentCardHeader from '@common/components/UI/PaymentCardHeader'
import TableCard from '@common/components/UI/TableCard'
import useDatesFilters from '@common/modules/hooks/useDatesFilters'
import PaymentTableContent from '@components/DashboardPage/blocks/paymentComponents/PaymentTableContent'
import { AppRoutes, Operations, Roles, paymentsTitle } from '@utils/constants'
import { NumberToFormattedMonth, renderCurrency } from '@utils/helpers'
import { Alert, Button, Popconfirm, Tooltip, message } from 'antd'
import { ColumnsType } from 'antd/es/table'
import cn from 'classnames'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import s from './style.module.scss'

interface PaymentDeleteItem {
  id: string
  date: string
  domain: string
  company: string
}

// function getDateFilter(value) {
//   const [, year, period, number] = value || []
//   // TODO: add enums
//   if (period === PERIOD_FILTR.QUARTER)
//     return {
//       year,
//       quarter: number,
//     }
//   if (period === PERIOD_FILTR.MONTH)
//     return {
//       year,
//       month: number,
//     }
//   if (period === PERIOD_FILTR.YEAR) return { year }
// }

const PaymentsBlock = () => {
  const router = useRouter()
  const {
    pathname,
    query: { email },
  } = router

  const [currentPayment, setCurrentPayment] = useState<IExtendedPayment>(null)
  const [paymentActions, setPaymentActions] = useState({
    edit: false,
    preview: false,
  })

  const [pageData, setPageData] = useState({
    pageSize: pathname === AppRoutes.PAYMENT ? 10 : 5,
    currentPage: 1,
  })

  const [filters, setFilters] = useState<Record<string, any>>({})



  const closeEditModal = () => {
    setCurrentPayment(null)
    setPaymentActions({
      edit: false,
      preview: false,
    })
  }

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
      month: filters?.month || undefined,
      year: filters?.year || undefined,
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

  const paymentsPageColumns: ColumnsType<any> =
    router.pathname === AppRoutes.PAYMENT
      ? [
          ...invoiceTypes.map((type) => ({
            title: paymentsTitle[type],
            dataIndex: type,
            render: (_, record) => {
              const item = record.invoice.find((item) => item.type === type)
              const sum = +(item?.sum || item?.price)
              const currency = renderCurrency(sum?.toFixed(2))
              return (
                <span className={currency === '-' ? s.currency : ''}>
                  {currency}
                </span>
              )
            },
          })),
        ]
      : []

  const globalAdminColumns: ColumnsType<any> = isGlobalAdmin
    ? [
        {
          align: 'center',
          fixed: 'right',
          title: '',
          width: 50,
          render: (_, payment: IExtendedPayment) => (
            <Button
              style={{ padding: 0 }}
              type="link"
              onClick={() => {
                setCurrentPayment(payment)
                setPaymentActions({ ...paymentActions, edit: true })
              }}
            >
              <EditOutlined className={s.icon} />
            </Button>
          ),
        },
        {
          align: 'center',
          fixed: 'right',
          title: '',
          width: 50,
          render: (_, payment: IExtendedPayment) => (
            <div className={s.popconfirm}>
              <Popconfirm
                id="popconfirm_custom"
                title={`Ви впевнені що хочете видалити оплату від ${dateToDefaultFormat(
                  payment?.invoiceCreationDate as unknown as string
                )}?`}
                onConfirm={() => handleDeletePayment(payment?._id)}
                okText="Видалити"
                cancelText="Ні"
                disabled={deleteLoading}
              >
                <DeleteOutlined className={s.icon} />
              </Popconfirm>
            </div>
          ),
        },
      ]
    : []

  const columns: ColumnsType<IExtendedPayment> = [
    {
      title: 'Дата створення',
      dataIndex: 'invoiceCreationDate',
      width: '155px',
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
      title: 'За місяць',
      dataIndex: 'month',
      filters:
          pathname === AppRoutes.PAYMENT ? payments?.monthFilter : null,
      filteredValue: filters?.month || null,
      render: (monthService, obj) =>
        NumberToFormattedMonth(
          new Date(monthService?.date || obj.invoiceCreationDate).getMonth()
        ),
    },
    {
      title: 'За рік',
      dataIndex: 'year',
      filters:
          pathname === AppRoutes.PAYMENT ? payments?.yearFilter : null,
      filteredValue: filters?.year || null,
      render: (monthService, obj) =>
        new Date(monthService?.date || obj.invoiceCreationDate).getFullYear(),
    },
    ...paymentsPageColumns,
    {
      fixed: 'right',
      title: '',
      width: 50,
      render: (_, payment: IExtendedPayment) => {
        return payment?.type === Operations.Debit ? (
          <div className={s.eyelined}>
            <Button
              type="link"
              onClick={() => {
                setCurrentPayment(payment)
                setPaymentActions({ ...paymentActions, preview: true })
              }}
            >
              <EyeOutlined className={s.eyelined} />
            </Button>
          </div>
        ) : (
          <></>
        )
      },
    },
    ...globalAdminColumns,
  ]

  columns.unshift({
    title: 'Компанія',
    dataIndex: 'company',
    fixed: 'left',
    filters:
      pathname === AppRoutes.PAYMENT ? payments?.realEstatesFilter : null,
    filteredValue: filters?.company || null,
    render: (i) => i?.companyName,
  })

  if (payments?.currentDomainsCount > 1) {
    columns.unshift({
      title: 'Надавач послуг',
      fixed: 'left',
      dataIndex: 'domain',
      filters: pathname === AppRoutes.PAYMENT ? payments?.domainsFilter : null,
      filteredValue: filters?.domain || null,
      render: (i) => i?.name,
    })
  }

  const [paymentsDeleteItems, setPaymentsDeleteItems] = useState<
    PaymentDeleteItem[]
  >([])

  const onSelect = (a, selected, rows) => {
    if (selected)
      setPaymentsDeleteItems([
        ...paymentsDeleteItems,
        {
          id: a?._id,
          date: a?.monthService?.date,
          domain: a?.domain?.name,
          company: a?.company?.companyName,
        },
      ])
    else
      setPaymentsDeleteItems(
        paymentsDeleteItems.filter((item) => item.id != a?._id)
      )
  }

  const rowSelection = {
    selectedRowKeys: paymentsDeleteItems.map((item) => item.id),
    defaultSelectedRowKeys: paymentsDeleteItems.map((item) => item.id),
    onSelect: onSelect,
  }

  const content =
    deleteError || paymentsError || currUserError ? (
      <Alert message="Помилка" type="error" showIcon closable />
    ) : (
      <PaymentTableContent
        path={pathname}
        payments={payments}
        columns={columns}
        currUser={currUser}
        rowSelection={rowSelection}
        loadings={{
          currUserLoading,
          currUserFetching,
          paymentsLoading,
          paymentsFetching,
        }}
        setPageData={setPageData}
        pageData={pageData}
        setFilters={setFilters}
      />
    )

  return (
    // <PaymentRemoveProvider>
    <TableCard
      title={
        <PaymentCardHeader
          paymentsDeleteItems={paymentsDeleteItems}
          closeEditModal={closeEditModal}
          currentPayment={currentPayment}
          paymentActions={paymentActions}
          payments={payments}
          filters={filters}
          setFilters={setFilters}
        />
      }
      className={cn({ [s.noScroll]: pathname === AppRoutes.PAYMENT })}
    >
      {content}
    </TableCard>
    // </PaymentRemoveProvider>
  )
}

export default PaymentsBlock
