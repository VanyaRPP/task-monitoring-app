import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons'
import {
  dateToDefaultFormat,
  dateToMonthYear,
} from '@assets/features/formatDate'
import {
  useDeletePaymentMutation,
  useGetAllPaymentsQuery,
} from '@common/api/paymentApi/payment.api'
import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import PaymentCardHeader from '@components/UI/PaymentCardHeader'
import TableCard from '@components/UI/TableCard'
import {
  AppRoutes,
  Operations,
  PERIOD_FILTR,
  Roles,
  paymentsTitle,
} from '@utils/constants'
import { renderCurrency, toFirstUpperCase } from '@utils/helpers'
import {
  Alert,
  Button,
  Pagination,
  Popconfirm,
  Table,
  TableColumnType,
  Tooltip,
  Typography,
  message,
} from 'antd'
import cn from 'classnames'
import { useRouter } from 'next/router'
import { ReactElement, useCallback, useMemo, useState } from 'react'
import s from './style.module.scss'

interface PaymentDeleteItem {
  id: string
  date: string
  domain: string
  company: string
}

function getDateFilter(value) {
  const [, year, period, number] = value || []
  // TODO: add enums
  if (period === PERIOD_FILTR.QUARTER)
    return {
      year,
      quarter: number,
    }
  if (period === PERIOD_FILTR.MONTH)
    return {
      year,
      month: number,
    }
  if (period === PERIOD_FILTR.YEAR) return { year }
}

function getTypeOperation(value) {
  if (value) {
    return {
      type: value === Operations.Debit ? Operations.Debit : Operations.Credit,
    }
  }
}

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
  const [currentDateFilter, setCurrentDateFilter] = useState()
  const [currentTypeOperation, setCurrentTypeOperation] = useState()
  const [pageData, setPageData] = useState({
    pageSize: pathname === AppRoutes.PAYMENT ? 10 : 5,
    currentPage: 1,
  })
  const [filters, setFilters] = useState<any>()

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
      ...getDateFilter(currentDateFilter),
      ...getTypeOperation(currentTypeOperation),
      companyIds: filters?.company || undefined,
      domainIds: filters?.domain || undefined,
      streetIds: filters?.street || undefined,
      type: filters?.type || undefined,
    },
    { skip: currUserLoading || !currUser }
  )

  const [deletePayment, { isLoading: deleteLoading, isError: deleteError }] =
    useDeletePaymentMutation()
  const isGlobalAdmin = currUser?.roles?.includes(Roles.GLOBAL_ADMIN)
  const isDomainAdmin = currUser?.roles?.includes(Roles.DOMAIN_ADMIN)

  const handleDeletePayment = useCallback(
    async (id: string) => {
      const response = await deletePayment(id)
      if ('data' in response) {
        message.success('Видалено!')
      } else {
        message.error('Помилка при видаленні рахунку')
      }
    },
    [deletePayment]
  )

  const invoiceTypes = Object.entries(paymentsTitle)

  const columns: TableColumnType<any>[] = useMemo(() => {
    return [
      {
        title: 'Надавач послуг',
        width: 160,
        fixed: 'left',
        dataIndex: 'domain',
        filters:
          router.pathname === AppRoutes.PAYMENT
            ? payments?.domainsFilter
            : null,
        filteredValue: filters?.domain || null,
        render: (i) => i?.name,
        hidden: payments?.currentDomainsCount <= 1,
        filterSearch: true,
      },
      {
        title: 'Компанія',
        dataIndex: 'company',
        fixed: 'left',
        width: 160,
        filters:
          router.pathname === AppRoutes.PAYMENT
            ? payments?.realEstatesFilter
            : null,
        filteredValue: filters?.company || null,
        filterSearch: true,
        render: (i) => {
          if (
            (isGlobalAdmin || isDomainAdmin) &&
            router.pathname === AppRoutes.PAYMENT
          ) {
            return (
              <Tooltip title="Додати в фільтри">
                <Typography.Link
                  onClick={() => {
                    setFilters({ ...filters, company: [i?._id] })
                  }}
                >
                  {i?.companyName}
                </Typography.Link>
              </Tooltip>
            )
          } else {
            return i?.companyName
          }
        },
      },
      {
        title: 'Дата створення',
        dataIndex: 'invoiceCreationDate',
        width: '155px',
        render: dateToDefaultFormat,
      },
      {
        title: <span>Тип</span>,
        dataIndex: 'type',
        filters: [
          {
            text: 'Кредит (Оплата)',
            value: Operations.Credit,
          },
          {
            text: 'Дебет (Реалізація)',
            value: Operations.Debit,
          },
        ],
        filteredValue: filters?.type || null,
        filterMultiple: false,

        children: [
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
        ],
      },
      {
        title: 'За місяць',
        width: 130,
        dataIndex: 'monthService',
        render: (monthService, obj) =>
          toFirstUpperCase(
            dateToMonthYear(monthService?.date || obj.invoiceCreationDate)
          ),
      },
      ...invoiceTypes.map(([type, title]) => ({
        title,
        dataIndex: type,
        render: (_, payment) => {
          const item = payment.invoice.find((item) => item.type === type)
          const sum = +(item?.sum || item?.price)
          const currency = renderCurrency(sum?.toFixed(2))
          return (
            <span className={currency === '-' ? s.currency : ''}>
              {currency}
            </span>
          )
        },
        hidden: router.pathname !== AppRoutes.PAYMENT,
      })),
      {
        fixed: 'right',
        title: '',
        width: 50,
        render: (_, payment: IExtendedPayment) =>
          payment?.type === Operations.Debit && (
            <Button
              icon={<EyeOutlined />}
              type="link"
              onClick={() => {
                setCurrentPayment(payment)
                setPaymentActions({ ...paymentActions, preview: true })
              }}
            />
          ),
      },
      {
        align: 'center',
        fixed: 'right',
        title: '',
        width: 50,
        render: (_, payment: IExtendedPayment) => (
          <Button
            icon={<EditOutlined />}
            type="link"
            onClick={() => {
              setCurrentPayment(payment)
              setPaymentActions({ ...paymentActions, edit: true })
            }}
          />
        ),
        hidden: !isDomainAdmin && !isGlobalAdmin,
      },
      {
        align: 'center',
        fixed: 'right',
        title: '',
        width: 50,
        render: (_, payment: IExtendedPayment) => (
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
            <Button type="text" icon={<DeleteOutlined />} />
          </Popconfirm>
        ),
        hidden: !isDomainAdmin && !isGlobalAdmin,
      },
    ].filter(({ hidden }) => !hidden) as TableColumnType<any>[]
  }, [
    isDomainAdmin,
    isGlobalAdmin,
    router,
    invoiceTypes,
    handleDeletePayment,
    paymentActions,
    deleteLoading,
    filters,
    setFilters,
    payments,
  ])

  const Summary = () => {
    const getFormattedValue = (dataIndex) => {
      const value = payments?.totalPayments?.[dataIndex] || 0
      return value !== 0 ? value.toFixed(2) : ''
    }

    return (
      router.pathname === AppRoutes.PAYMENT &&
      payments?.data && (
        <Table.Summary>
          <Table.Summary.Row className={s.summ_item}>
            {columns.map((item, index) => (
              <Table.Summary.Cell index={index} key={index}>
                {getFormattedValue(item.dataIndex)}
              </Table.Summary.Cell>
            ))}
          </Table.Summary.Row>
          <Table.Summary.Row className={s.saldo}>
            {columns.map((item, index) => {
              if (item.dataIndex === Operations.Debit) {
                return
              }

              return (
                <Table.Summary.Cell
                  index={index}
                  key={index}
                  colSpan={item.dataIndex === Operations.Credit ? 2 : 1}
                >
                  {item.dataIndex === Operations.Credit &&
                    (
                      (payments?.totalPayments?.debit || 0) -
                      (payments?.totalPayments?.credit || 0)
                    )?.toFixed(2)}
                </Table.Summary.Cell>
              )
            })}
          </Table.Summary.Row>
        </Table.Summary>
      )
    )
  }

  let content: ReactElement

  const [paymentsDeleteItems, setPaymentsDeleteItems] = useState<
    PaymentDeleteItem[]
  >([])
  const [selectedPayments, setSelectedPayments] = useState<IExtendedPayment[]>(
    []
  )
  const onSelect = (a, selected, rows) => {
    if (selected) {
      setPaymentsDeleteItems([
        ...paymentsDeleteItems,
        {
          id: a?._id,
          date: a?.monthService?.date,
          domain: a?.domain?.name,
          company: a?.company?.companyName,
        },
      ])
      setSelectedPayments([...selectedPayments, a])
    } else {
      setPaymentsDeleteItems(
        paymentsDeleteItems.filter((item) => item.id != a?._id)
      )
      setSelectedPayments(
        selectedPayments.filter((item) => item._id !== a?._id)
      )
    }
  }

  const rowSelection = {
    selectedRowKeys: paymentsDeleteItems.map((item) => item.id),
    preserveSelectedRowKeys: true,
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedPayments(selectedRows)
      setPaymentsDeleteItems(
        selectedRows.map((item) => ({
          id: item._id,
          date: item.monthService?.date,
          domain: item.domain?.name,
          company: item.company?.companyName,
        }))
      )
    },
    onSelect: onSelect,
  }

  if (deleteError || paymentsError || currUserError) {
    content = <Alert message="Помилка" type="error" showIcon closable />
  } else {
    content = (
      <>
        <Table
          rowSelection={
            currUser?.roles?.includes(Roles.GLOBAL_ADMIN) &&
            pathname === AppRoutes.PAYMENT
              ? rowSelection
              : null
          }
          columns={columns}
          dataSource={payments?.data}
          pagination={false}
          onChange={(__, filters) => {
            setFilters(filters)
          }}
          scroll={{ x: 1800 }}
          summary={() => <Summary />}
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
    // <PaymentRemoveProvider>
    <TableCard
      title={
        <PaymentCardHeader
          paymentsDeleteItems={paymentsDeleteItems}
          closeEditModal={closeEditModal}
          setCurrentDateFilter={setCurrentDateFilter}
          setCurrentTypeOperation={setCurrentTypeOperation}
          currentPayment={currentPayment}
          paymentActions={paymentActions}
          streets={payments?.addressFilter}
          payments={payments}
          filters={filters}
          setFilters={setFilters}
          selectedPayments={selectedPayments}
          setSelectedPayments={setSelectedPayments}
          setPaymentsDeleteItems={setPaymentsDeleteItems}
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
