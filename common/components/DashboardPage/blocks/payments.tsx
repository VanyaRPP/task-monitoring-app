import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  MoreOutlined,
} from '@ant-design/icons'
import {
  dateToDefaultFormat,
  dateToMonth,
  dateToMonthYear,
} from '@assets/features/formatDate'
import {
  useGetAddressFiltersQuery,
  useGetDateFiltersQuery,
  useGetDomainFiltersQuery,
  useGetRealEstateFiltersQuery,
} from '@common/api/filterApi/filter.api'
import {
  useDeletePaymentMutation,
  useGetAllPaymentsQuery,
} from '@common/api/paymentApi/payment.api'
import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import PaymentCardHeader from '@components/UI/PaymentCardHeader'
import TableCard from '@components/UI/TableCard'
import {
  AppRoutes,
  Operations,
  PERIOD_FILTR,
  Roles,
  ServiceName,
  ServiceType,
} from '@utils/constants'
import {
  isEmpty,
  renderCurrency,
  toFirstUpperCase,
  toRoundFixed,
} from '@utils/helpers'
import {
  Alert,
  Button,
  Empty,
  Flex,
  List,
  Popconfirm,
  Popover,
  Table,
  TableColumnType,
  Tooltip,
  Typography,
  message,
  theme,
  Dropdown,
} from 'antd'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import s from './style.module.scss'
import { skipToken } from '@reduxjs/toolkit/query'

interface PaymentsBlockProps {
  sepDomainID?: string
}

interface PaymentDeleteItem {
  id: string
  date: string
  domain: string
  company: string
}

const typeFilters = [
  {
    text: 'Кредит (Оплата)',
    value: Operations.Credit,
  },
  {
    text: 'Дебет (Реалізація)',
    value: Operations.Debit,
  },
]

const getSummaryColumns = (
  columns: TableColumnType<any>[] = [],
  index = 0
): Array<{ column: TableColumnType<any>; index: number }> => {
  let count = index
  return columns?.reduce((cells, column: any) => {
    if (column.children) {
      const nested = getSummaryColumns(column.children, count)
      count += column.children.length
      return [...cells, ...nested]
    }
    return [...cells, { column, index: count++ }]
  }, [])
}

function formatDateFilterForQuery(value: string[] | undefined) {
  if (!value || value.length === 0) return {}

  const months: number[] = []
  let year: number | null = null

  for (const str of value) {
    const match = str.match(/^(\d+)-(\w+)-(\d+)$/)
    if (!match) continue

    const [, y, period, number] = match
    const parsedYear = Number(y)
    if (!year) year = parsedYear

    if (period === PERIOD_FILTR.MONTH) {
      months.push(Number(number))
    } else if (period === PERIOD_FILTR.QUARTER) {
      const q = Number(number)
      months.push(...[(q - 1) * 3 + 1, (q - 1) * 3 + 2, (q - 1) * 3 + 3])
    } else if (period === PERIOD_FILTR.YEAR) {
    }
  }

  const query: any = {}
  if (year) query.year = year
  if (months.length > 0) {
    query.month = months.length === 1 ? months[0] : months
  }

  return query
}

function getTypeOperation(value) {
  if (value) {
    return {
      type: value === Operations.Debit ? Operations.Debit : Operations.Credit,
    }
  }
}

const PaymentsBlock: React.FC<PaymentsBlockProps> = ({ sepDomainID }) => {
  const paginationTriggeredRef = useRef(false)
  const router = useRouter()
  const [currentPayment, setCurrentPayment] =
    useState<Partial<IExtendedPayment>>(null)
  const [paymentActions, setPaymentActions] = useState({
    edit: false,
    preview: false,
  })
  const [currentDateFilter, setCurrentDateFilter] = useState<
    string[] | undefined
  >()
  const [currentTypeOperation, setCurrentTypeOperation] = useState()
  const [pageData, setPageData] = useState({
    pageSize: router.pathname === AppRoutes.PAYMENT ? 10 : 5,
    currentPage: 1,
  })
  const [selectedDateField, setSelectedDateField] = useState<
    'invoiceCreationDate' | 'date'
  >('invoiceCreationDate')

  const [selectedColumns, setSelectedColumns] = useState<string[]>([])

  const [filters, setFilters] = useState<any>()

  const { data: domainsFilters } = useGetDomainFiltersQuery({
    realEstates: filters?.company,
  })
  const { data: companiesFilter } = useGetRealEstateFiltersQuery({
    domains: filters?.domain,
  })

  const {
    isFetching: currUserFetching,
    isLoading: currUserLoading,
    isError: currUserError,
    data: currUser,
  } = useGetCurrentUserQuery()
  const isGlobalAdmin = currUser?.roles?.includes(Roles.GLOBAL_ADMIN)
  const isDomainAdmin = currUser?.roles?.includes(Roles.DOMAIN_ADMIN)
  const isUser = currUser?.roles?.includes(Roles.USER)

  useEffect(() => {
    if (domainsFilters?.domainsFilter?.length === 1) {
      setFilters({
        ...filters,
        domain: [domainsFilters?.domainsFilter[0]?.value],
      })
    }
    if (companiesFilter?.realEstatesFilter?.length === 1) {
      setFilters({
        ...filters,
        company: [companiesFilter?.realEstatesFilter[0]?.value],
      })
    }
  }, [domainsFilters, companiesFilter])

  const { data: dateFilters } = useGetDateFiltersQuery({ type: 'payment' })

  const handlePagination = (pagination) => {
    paginationTriggeredRef.current = true
    setPageData({
      pageSize: pagination.pageSize,
      currentPage: pagination.current,
    })
  }

  const closeEditModal = () => {
    setCurrentPayment(null)
    setPaymentActions({
      edit: false,
      preview: false,
    })
  }

  const { token } = theme.useToken()

  const { data: streetsFilter } = useGetAddressFiltersQuery({
    domains: filters?.domain,
  })
  const shouldSkipQuery =
  currUserLoading || !currUser || !pageData.pageSize || !pageData.currentPage

const pageKey = useMemo(
  () => `${pageData.currentPage}_${pageData.pageSize}`,
  [pageData]
)

const queryArgs = shouldSkipQuery
  ? skipToken
  : {
      skip: (pageData.currentPage - 1) * pageData.pageSize,
      limit: pageData.pageSize,
      pageKey, 
      ...formatDateFilterForQuery(currentDateFilter),
      ...getTypeOperation(currentTypeOperation),
      dateField: selectedDateField,
      companyIds: filters?.company || undefined,
      domainIds: sepDomainID || filters?.domain || undefined,
      streetIds: filters?.street || undefined,
      type: filters?.type || undefined,
    }

const {
  isFetching: paymentsFetching,
  isLoading: paymentsLoading,
  isError: paymentsError,
  data: payments,
} = useGetAllPaymentsQuery(queryArgs, {
  refetchOnMountOrArgChange: true,
})

  const [deletePayment, { isLoading: deleteLoading, isError: deleteError }] =
    useDeletePaymentMutation()

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

  useEffect(() => {
    if (filters?.domain?.length > 0) {
      setCurrentPayment({
        domain: { _id: filters.domain[0] },
      })
    }
  }, [filters])

  const [appliedFilters, setAppliedFilters] = useState<any>()

  useEffect(() => {
    const filtersChanged =
      JSON.stringify(appliedFilters) !== JSON.stringify(filters)
  
    if (filtersChanged && !paginationTriggeredRef.current) {
      setPageData((prev) => ({
        ...prev,
        currentPage: 1,
      }))
    }
      paginationTriggeredRef.current = false
  }, [appliedFilters])
  const isSingleDomainCurrentPage = useMemo(() => {
    if (
      paymentsLoading ||
      paymentsFetching ||
      !payments?.data?.length
    ) {
      return undefined;
    }
    const domainIds = payments.data.map((p) =>
      typeof p.domain === 'string' ? p.domain : p.domain?._id
    );
    const unique = new Set(domainIds);
    return unique.size === 1;
  }, [payments?.data, paymentsLoading, paymentsFetching]);
  
  const columns: TableColumnType<any>[] = useMemo(() => {
    return [
      ...(!isSingleDomainCurrentPage   ? [{
        title: 'Надавач послуг',
        width: router.pathname === AppRoutes.PAYMENT ? 170 : 80,
        dataIndex: 'domain',
        filters:
          router.pathname === AppRoutes.PAYMENT
            ? domainsFilters?.domainsFilter
            : null,
        filteredValue: filters?.domain || null,
        filterSearch: true,
        render: (domain) =>
          router.pathname === AppRoutes.PAYMENT ? (
            <Tooltip title="Додати в фільтри">
              <Typography.Link
                onClick={() =>
                  setFilters({ ...filters, domain: [domain?._id] })
                }
              >
                {domain?.name}
              </Typography.Link>
            </Tooltip>
          ) : (
            domain?.name
          ),
        },
      ]
    : []),
      {
        title: 'Компанія',
        dataIndex: 'company',
        width: router.pathname === AppRoutes.PAYMENT ? 140 : 100,
        filters:
          router.pathname === AppRoutes.PAYMENT
            ? companiesFilter?.realEstatesFilter
            : null,
        filteredValue: filters?.company || null,
        filterSearch: true,
        render: (company) =>
          router.pathname === AppRoutes.PAYMENT ? (
            <Tooltip title="Додати в фільтри">
              <Typography.Link
                onClick={() =>
                  setFilters({ ...filters, company: [company?._id] })
                }
              >
                {company?.companyName}
              </Typography.Link>
            </Tooltip>
          ) : (
            company?.companyName
          ),
        hidden: payments?.realEstatesFilter?.length <= 1,
      },
      {
        title: 'Дата створення',
        dataIndex: 'invoiceCreationDate',
        render: dateToDefaultFormat,
        width: router.pathname === AppRoutes.PAYMENT ? 164 : 70,
      }
      ,
      {
        title: 'Тип',
        dataIndex: 'type',
        align: 'center',
        filters: router.pathname === AppRoutes.PAYMENT ? typeFilters : null,
        filteredValue: filters?.type || null,
        filterMultiple: false,
        children: [
          {
            title: <Tooltip title="Дебет (Реалізація)">Дебет</Tooltip>,
            dataIndex: 'debit',
            align: 'center',
            width: router.pathname === AppRoutes.PAYMENT ? 130 : 45,
            render: (_, payment: IExtendedPayment) =>
              payment.type === Operations.Debit ? (
                renderCurrency(payment.generalSum)
              ) : (
                <span className={s.currency}>-</span>
              ),
            sorter:
              router.pathname === AppRoutes.PAYMENT
                ? (a, b) => a.generalSum - b.generalSum
                : null,
          },
          {
            title: <Tooltip title="Кредит (Оплата)">Кредит</Tooltip>,
            dataIndex: 'credit',
            align: 'center',
            width: router.pathname === AppRoutes.PAYMENT ? 130 : 45,
            render: (_, payment: IExtendedPayment) =>
              payment.type === Operations.Credit ? (
                renderCurrency(payment.generalSum)
              ) : (
                <span className={s.currency}>-</span>
              ),
            sorter:
              router.pathname === AppRoutes.PAYMENT
                ? (a, b) => a.generalSum - b.generalSum
                : null,
          },
        ],
      },
      {
        title: 'За місяць',
        align: 'center',
        dataIndex: 'monthService',
        filters: router.pathname === AppRoutes.PAYMENT ? null : null,
        filteredValue: filters?.domain || null,
        filterSearch: true,
        width: router.pathname === AppRoutes.PAYMENT ? 164 : 75,
        render: (monthService: IService, obj) => (
          <Popover
            content={
              !isEmpty(monthService) && (
                <List
                  size="small"
                  dataSource={[
                    {
                      label: ServiceName.maintenancePrice,
                      value: monthService?.rentPrice,
                    },
                    {
                      label: ServiceName.electricityPrice,
                      value: monthService?.electricityPrice,
                    },
                    {
                      label: ServiceName.waterPrice,
                      value: monthService?.waterPrice,
                    },
                    {
                      label: ServiceName.waterPart,
                      value: monthService?.waterPriceTotal,
                    },
                    {
                      label: ServiceName.garbageCollectorPrice,
                      value: monthService?.garbageCollectorPrice,
                    },
                    {
                      label: ServiceName.inflicionPrice,
                      value: monthService?.inflicionPrice,
                    },
                  ]}
                  renderItem={(item) =>
                    !isEmpty(item.value) && (
                      <List.Item>
                        <Flex
                          justify="space-between"
                          gap={16}
                          style={{ width: '100%' }}
                        >
                          <Typography.Text strong>{item.label}</Typography.Text>
                          <Typography.Text>{item.value}</Typography.Text>
                        </Flex>
                      </List.Item>
                    )
                  }
                />
              )
            }
          >
            <Button
              disabled={isEmpty(monthService)}
              block
              style={{
                border: 'none',
                backgroundColor: token.colorFillSecondary,
              }}
            >
              {toFirstUpperCase(
                dateToMonthYear(monthService?.date || obj.invoiceCreationDate)
              )}
            </Button>
          </Popover>
        ),
      },
      ...selectedColumns.map((value) => ({
        title: ServiceName[value],
        width: 132,
        ellipsis: true,
        dataIndex: value,
        render: (_, payment) => {
          const item = payment.invoice.find((item) => item.type === value)
          const sum = +(item?.sum || item?.price)
          const currency = renderCurrency(sum?.toFixed(2))
          return (
            <span className={currency === '-' ? s.currency : ''}>
              {currency}
            </span>
          )
        },
        hidden: router.pathname !== AppRoutes.PAYMENT,
        sorter: (a, b) =>
          (a.invoice.find((i) => i.type === value)?.sum || 0) -
          (b.invoice.find((i) => i.type === value)?.sum || 0),
      })),
      {
        fixed: 'right',
        align: 'center',
        title: '',
        width: router.pathname === AppRoutes.PAYMENT ? 80 : 25,
        render: (_, payment: IExtendedPayment) =>
          payment?.type === Operations.Debit && (
            <Button
              style={{ padding: 0 }}
              type="link"
              onClick={() => {
                setCurrentPayment(payment)
                setPaymentActions({ ...paymentActions, preview: true })
              }}
            >
              <EyeOutlined />
            </Button>
          ),
      },
      {
        align: 'center',
        fixed: 'right',
        title: '',
        width: router.pathname === AppRoutes.PAYMENT ? 80 : 25,
        render: (_, payment: IExtendedPayment) => (
          <Dropdown
            menu={{
              items: [
                {
                  key: 'edit',
                  label: (
                    <Button
                      icon={<EditOutlined />}
                      type="link"
                      style={{
                        color: '#722ed1',
                        paddingLeft: '10px',
                        paddingRight: '10px',
                      }}
                      onClick={() => {
                        setCurrentPayment(payment)
                        setPaymentActions({ ...paymentActions, edit: true })
                      }}
                    >
                      Редагувати
                    </Button>
                  ),
                },
                isGlobalAdmin && {
                  key: 'delete',
                  label: (
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
                      <Button
                        type="text"
                        icon={<DeleteOutlined />}
                        style={{
                          color: '#ff4d4f',
                          paddingLeft: '10px',
                          paddingRight: '10px',
                        }}
                      >
                        Видалити
                      </Button>
                    </Popconfirm>
                  ),
                },
              ],
            }}
            placement="bottomRight"
          >
            <Button icon={<MoreOutlined />} />
          </Dropdown>
        ),
      },
    ].filter(Boolean) as TableColumnType<any>[]; 
  }, [
    isSingleDomainCurrentPage ,
    pageData.currentPage,
    router,
    paymentActions,
    isDomainAdmin,
    isGlobalAdmin,
    handleDeletePayment,
    deleteLoading,
    filters,
    setFilters,
    token,
    selectedColumns,
  ])
  const showDomainFilter = useMemo(
    () => columns.some((col) => col.dataIndex === 'domain'),
    [columns]
  );

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

  const summaryColumns = useMemo(() => {
    return getSummaryColumns(
      currUser?.roles?.includes(Roles.GLOBAL_ADMIN) &&
        router.pathname === AppRoutes.PAYMENT
        ? [{}, ...columns]
        : columns
    )
  }, [columns, currUser, router])

  const handleCascaderChange = (value: string[] | undefined) => {
    if (!Array.isArray(value)) {
      setCurrentDateFilter(undefined)
      setFilters((prev) => {
        const { invoiceCreationDate, ...rest } = prev || {}
        return rest
      })
      return
    }
    let formatted: string[] = []
    if (value.length === 3 && value[0] === 'year' && value[2] === 'year') {
      const selectedYear = value[1]
      formatted = [`${selectedYear}-year-1`]
    }
  
    if (value.length === 4 && value[2] === 'month') {
      const selectedYear = value[1]
      const selectedMonth = value[3]
      formatted = [`${selectedYear}-month-${selectedMonth}`]
    }
  
    if (value.length === 4 && value[2] === 'quarter') {
      const selectedYear = value[1]
      const selectedQuarter = value[3]
      formatted = [`${selectedYear}-quarter-${selectedQuarter}`]
    }
  
    setCurrentDateFilter(formatted)
    setFilters((prev) => ({
      ...prev,
      invoiceCreationDate: formatted,
    }))
  }
  useEffect(() => {
    if (filters?.invoiceCreationDate?.length > 0) {
      setCurrentDateFilter(filters.invoiceCreationDate)
    }
  }, [filters?.invoiceCreationDate])
   
  return (
    <TableCard
      title={
        <PaymentCardHeader
          paymentsDeleteItems={paymentsDeleteItems}
          closeEditModal={closeEditModal}
          setCurrentDateFilter={setCurrentDateFilter}
          currentPayment={currentPayment}
          paymentActions={paymentActions}
          streets={streetsFilter?.streetsFilter}
          payments={payments}
          filters={filters}
          setFilters={setFilters}
          selectedPayments={selectedPayments}
          setSelectedPayments={setSelectedPayments}
          setPaymentsDeleteItems={setPaymentsDeleteItems}
          enablePaymentsButton={sepDomainID ? false : true}
          onColumnsSelect={setSelectedColumns}
          domainFilter={showDomainFilter ? domainsFilters?.domainsFilter : undefined}
          realEstatesFilter={companiesFilter?.realEstatesFilter}
          onCascaderChange={handleCascaderChange}
        />
      }
    >
      {deleteError || paymentsError || currUserError ? (
        <Alert message="Помилка" type="error" showIcon closable />
      ) : (
        <Table 
          key={columns.map((col) => col.dataIndex).join(',')}
          rowKey="_id"
          rowSelection={
            currUser?.roles?.includes(Roles.GLOBAL_ADMIN) &&
            router.pathname === AppRoutes.PAYMENT && {
              selectedRowKeys: paymentsDeleteItems.map((item) => item.id),
              preserveSelectedRowKeys: true,
              onChange: (_, selectedRows) => {
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
          }
          columns={columns}
          dataSource={payments?.data}
          pagination={
            (router.pathname === AppRoutes.PAYMENT ||
              router.pathname === AppRoutes.SEP_DOMAIN) && {
              current: pageData.currentPage,
              pageSize: pageData.pageSize, 
              total: payments?.total || 0,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50],
              position: ['bottomCenter'],
            }
          }
          onChange={(pagination, nextFilters) => {
            handlePagination(pagination)
            const { invoiceCreationDate, ...otherFilters } = nextFilters || {}
            setFilters((prev) => ({
              ...prev,
              ...otherFilters,
              invoiceCreationDate: prev?.invoiceCreationDate,
            }))
            setAppliedFilters((prev) => ({
              ...prev,
              ...otherFilters,
            }))
          }}
          scroll={{
            x:
              (router.pathname === AppRoutes.PAYMENT
                ? 1300 + selectedColumns.length * 132
                : 1300) -
              (payments?.realEstatesFilter?.length <= 1 ? 200 : 0) -
              (payments?.domainsFilter?.length <= 1 ? 200 : 0),
          }}
          summary={() =>
            payments?.data?.length > 0 ? (
              <Table.Summary>
                <Table.Summary.Row>
                  {summaryColumns.map(({ column, index }) =>
                    column.dataIndex === 'debit' ? (
                      <Table.Summary.Cell key={index} index={index} align="center">
                        {renderCurrency(toRoundFixed(payments?.totalPayments?.debit))}
                      </Table.Summary.Cell>
                    ) : column.dataIndex === 'credit' ? (
                      <Table.Summary.Cell key={index} index={index} align="center">
                        {renderCurrency(toRoundFixed(payments?.totalPayments?.credit))}
                      </Table.Summary.Cell>
                    ) : (
                      <Table.Summary.Cell key={index} index={index}>
                        {Object.values(ServiceType).includes(column.dataIndex)
                          ? renderCurrency(
                              toRoundFixed(payments?.totalPayments?.[column.dataIndex])
                            )
                          : null}
                      </Table.Summary.Cell>
                    )
                  )}
                </Table.Summary.Row>
                <Table.Summary.Row>
                  {summaryColumns.map(({ column, index }) =>
                    column.dataIndex !== 'credit' ? (
                      <Table.Summary.Cell
                        key={index}
                        index={index}
                        colSpan={column.dataIndex === 'debit' ? 2 : 1}
                        align="center"
                      >
                        {column.dataIndex === 'debit'
                          ? renderCurrency(
                              toRoundFixed(
                                Number(payments?.totalPayments?.debit || 0) -
                                  Number(payments?.totalPayments?.credit || 0)
                              )
                            )
                          : null}
                      </Table.Summary.Cell>
                    ) : null
                  )}
                </Table.Summary.Row>
              </Table.Summary>
            ) : null
          }
          bordered
          locale={{ emptyText: <Empty description="No Data" /> }}
          loading={
            currUserLoading ||
            currUserFetching ||
            paymentsLoading ||
            paymentsFetching
          }
        />
      )}
    </TableCard>
  )
}

export default PaymentsBlock
