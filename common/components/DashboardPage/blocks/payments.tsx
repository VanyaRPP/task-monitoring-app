import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons'
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
  Badge,
} from 'antd'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import s from './style.module.scss'
import { useGetDebtorsQuery } from '@common/api/debtorsApi/debtors.api'

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
    if (!year) year = Number(y)
    if (period === PERIOD_FILTR.MONTH) {
      months.push(Number(number))
    }
  }

  const query: any = {
    year,
  }

  if (months.length === 1) {
    query.month = months[0]
  } else if (months.length > 1) {
    query.month = months
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

const getDebtorTooltipColor = (debtor) => {
  if (debtor.totalDebt > 0 && debtor.totalDebt < 5000) {
    return 'gray'
  } else if (debtor.totalDebt >= 5000 && debtor.totalDebt < 20000) {
    return 'yellow'
  } else if (debtor.totalDebt >= 20000) {
    return 'red'
  }
}

const PaymentsBlock: React.FC<PaymentsBlockProps> = ({ sepDomainID }) => {
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

  const {
    isFetching: paymentsFetching,
    isLoading: paymentsLoading,
    isError: paymentsError,
    data: payments,
  } = useGetAllPaymentsQuery(
    {
      skip: (pageData.currentPage - 1) * pageData.pageSize,
      limit: pageData.pageSize,
      ...formatDateFilterForQuery(currentDateFilter),
      ...getTypeOperation(currentTypeOperation),
      dateField: selectedDateField,
      companyIds: filters?.company || undefined,
      domainIds: sepDomainID || filters?.domain || undefined,
      streetIds: filters?.street || undefined,
      type: filters?.type || undefined,
    },
    { skip: currUserLoading || !currUser }
  )

  const [domainIds, setDomainIds] = useState([])

  const { data, error } = useGetDebtorsQuery(
    { domainIds: domainIds },
    { skip: !domainIds || domainIds.length === 0 }
  )
  const debtorCompanies = data?.companies

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
    if (appliedFilters && appliedFilters !== filters) {
      setPageData((prev) => ({
        ...prev,
        currentPage: 1,
      }))
    }
  }, [appliedFilters])

  useEffect(() => {
    if (JSON.stringify(appliedFilters) !== JSON.stringify(filters)) {
      setPageData((prev) => ({ ...prev, currentPage: 1 }))
    }
  }, [appliedFilters])
  useEffect(() => {
    const fallbackDomains = domainsFilters?.domainsFilter?.map((d) => d.value)
    if (filters?.domain?.length) {
      setDomainIds(filters.domain)
    } else if (fallbackDomains?.length) {
      setDomainIds(fallbackDomains)
    }
  }, [filters?.domain, domainsFilters])

  const columns: TableColumnType<any>[] = useMemo(() => {
    return [
      {
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
        hidden: payments?.domainsFilter?.length <= 1,
      },
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
        render: (company) => {
          const companyName = company?.companyName || ''
          const debtor = Array.isArray(debtorCompanies)
            ? debtorCompanies.find((d) => d.companyName === companyName)
            : null

          return !isUser && debtor ? (
            <Badge
              count={debtor.totalDebt.toFixed(2)}
              title=""
              color={getDebtorTooltipColor(debtor)}
              overflowCount={Infinity}
              style={{ cursor: 'pointer' }}
              size="small"
            >
              <Tooltip title="Додати в фільтри">
                <Typography.Link
                  onClick={() =>
                    setFilters({ ...filters, company: [company?._id] })
                  }
                >
                  {companyName}
                </Typography.Link>
              </Tooltip>
            </Badge>
          ) : (
            <Tooltip title="Додати в фільтри">
              <Typography.Link
                onClick={() =>
                  setFilters({ ...filters, company: [company?._id] })
                }
              >
                {companyName}
              </Typography.Link>
            </Tooltip>
          )
        },
        hidden: payments?.realEstatesFilter?.length <= 1,
      },
      {
        title: 'Дата створення',
        dataIndex: 'invoiceCreationDate',
        render: dateToDefaultFormat,
        width: router.pathname === AppRoutes.PAYMENT ? 164 : 70,
        filters:
          dateFilters?.monthFilter
            ?.filter((filter) => filter.value !== null)
            ?.map((filter) => ({
              text: dateToMonth(new Date(2000, Number(filter.value) - 1)),
              value: `${new Date().getFullYear()}-month-${filter.value}`,
            })) || [],
        filteredValue: filters?.invoiceCreationDate || null,
      },
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
          <Button
            style={{ padding: 0 }}
            type="link"
            onClick={() => {
              setCurrentPayment(payment)
              setPaymentActions({ ...paymentActions, edit: true })
            }}
          >
            <EditOutlined />
          </Button>
        ),
        hidden: !isDomainAdmin && !isGlobalAdmin,
      },
      {
        align: 'center',
        fixed: 'right',
        title: '',
        width: router.pathname === AppRoutes.PAYMENT ? 80 : 25,

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
    payments,
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
    debtorCompanies,
  ])

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
          domainFilter={domainsFilters?.domainsFilter}
          realEstatesFilter={companiesFilter?.realEstatesFilter}
        />
      }
    >
      {deleteError || paymentsError || currUserError ? (
        <Alert message="Помилка" type="error" showIcon closable />
      ) : (
        <Table
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
              total: payments?.total || 0,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50],
              position: ['bottomCenter'],
              onChange: handlePagination,
            }
          }
          onChange={(_, nextFilters) => {
            setFilters(nextFilters)
            setAppliedFilters(nextFilters)
            const val = nextFilters?.invoiceCreationDate
            setCurrentDateFilter(Array.isArray(val) ? val.map(String) : [])
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
                      <Table.Summary.Cell
                        key={index}
                        index={index}
                        align="center"
                      >
                        {renderCurrency(
                          toRoundFixed(payments?.totalPayments?.debit)
                        )}
                      </Table.Summary.Cell>
                    ) : column.dataIndex === 'credit' ? (
                      <Table.Summary.Cell
                        key={index}
                        index={index}
                        align="center"
                      >
                        {renderCurrency(
                          toRoundFixed(payments?.totalPayments?.credit)
                        )}
                      </Table.Summary.Cell>
                    ) : (
                      <Table.Summary.Cell key={index} index={index}>
                        {Object.values(ServiceType).includes(column.dataIndex)
                          ? renderCurrency(
                              toRoundFixed(
                                payments?.totalPayments?.[column.dataIndex]
                              )
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
