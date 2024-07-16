import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons'
import {
  useDeletePaymentMutation,
  useGetAllPaymentsQuery,
} from '@common/api/paymentApi/payment.api'
import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import {
  dateToDefaultFormat,
  dateToMonthYear,
} from '@common/assets/features/formatDate'
import PaymentCardHeader from '@common/components/UI/PaymentCardHeader'
import TableCard from '@common/components/UI/TableCard'
import {
  AppRoutes,
  ColumnsRoleView,
  Operations,
  PERIOD_FILTR,
  Roles,
  paymentsTitle,
} from '@utils/constants'
import { renderCurrency } from '@utils/helpers'
import {
  Alert,
  Button,
  Pagination,
  Popconfirm,
  Table,
  Tooltip,
  message,
} from 'antd'
import cn from 'classnames'
import { useRouter } from 'next/router'
import { ReactElement, useState } from 'react'
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
    },
    { skip: currUserLoading || !currUser }
  )

  const [deletePayment, { isLoading: deleteLoading, isError: deleteError }] =
    useDeletePaymentMutation()
  const isGlobalAdmin = currUser?.roles?.includes(Roles.GLOBAL_ADMIN)
  const isDomainAdmin = currUser?.roles?.includes(Roles.DOMAIN_ADMIN)

  const handleDeletePayment = async (id: string) => {
    const response = await deletePayment(id)
    if ('data' in response) {
      message.success('Видалено!')
    } else {
      message.error('Помилка при видаленні рахунку')
    }
  }

  const invoiceTypes = Object.entries(paymentsTitle)

  const paymentsPageColumns =
    router.pathname === AppRoutes.PAYMENT
      ? invoiceTypes.map(([type, title]) => ({
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
        }))
      : []

  const adminColumns =
    isGlobalAdmin || isDomainAdmin
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

  // TODO: add Interface
  const columns: any = [
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
      dataIndex: 'monthService',
      render: (monthService, obj) =>
        dateToMonthYear(monthService?.date || obj.invoiceCreationDate),
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
    ...adminColumns,
  ]

  columns.unshift({
    title: 'Компанія',
    dataIndex: 'company',
    fixed: 'left',
    filters:
      pathname === AppRoutes.PAYMENT ? payments?.realEstatesFilter : null,
    filteredValue: filters?.company || null,
    render: (i) => {
      if (currUser?.roles?.includes(Roles.GLOBAL_ADMIN || Roles.DOMAIN_ADMIN)) {
        if (pathname === AppRoutes.PAYMENT) {
          return (
            <a
              style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}
              onClick={() => {
                setFilters({ ...filters, company: [i?._id] })
              }}
            >
              {i?.companyName}
            </a>
          );
        } else {
          return i?.companyName;
        }
      } else {
        return i?.companyName;
      }
    },
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
            {columns.map((item, index) => {
              const dataindex = isGlobalAdmin
                ? columns[index - 1]?.dataIndex
                : item.dataIndex

              return (
                <Table.Summary.Cell
                  index={0}
                  key={index}
                  colSpan={item.dataIndex === '' ? 2 : 1}
                >
                  {getFormattedValue(dataindex)}
                </Table.Summary.Cell>
              )
            })}
          </Table.Summary.Row>
          <Table.Summary.Row className={s.saldo}>
            {columns.slice(0, columns.length - 1).map((item, index) => {
              const dataindex = isGlobalAdmin
                ? columns[index - 1]?.dataIndex
                : item.dataIndex

              const colSpan = isGlobalAdmin
                ? item.dataIndex === Operations.Credit
                  ? ColumnsRoleView.User
                  : ColumnsRoleView.GlobalAdmin
                : item.dataIndex === Operations.Debit
                ? ColumnsRoleView.User
                : ColumnsRoleView.GlobalAdmin

              return (
                <Table.Summary.Cell colSpan={colSpan} index={0} key={index}>
                  {dataindex === Operations.Debit
                    ? (
                        (payments?.totalPayments?.debit || 0) -
                        (payments?.totalPayments?.credit || 0)
                      )?.toFixed(2)
                    : false}
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
