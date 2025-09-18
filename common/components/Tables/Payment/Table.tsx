import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import {
  Alert,
  Badge,
  Button,
  Empty,
  List,
  Popconfirm,
  Table,
  theme,
  Tooltip,
  Typography,
} from 'antd'
import { ColumnsType, ColumnType } from 'antd/es/table'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import { usePermissions } from '@utils/helpers'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'

import { IPaymentFilterResponse } from '@common/api/filterApi/filter.api.types'
import {
  IExtendedPayment,
  IFilter,
  IGetPaymentResponse,
} from '@common/api/paymentApi/payment.api.types'

import {
  dateToDefaultFormat,
  dateToMonth,
  dateToMonthYear,
} from '@assets/features/formatDate'
import {
  AppRoutes,
  Operations,
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
import { Grid } from 'antd'
import s from './style.module.scss'

export interface PaymentDeleteItem {
  id: string
  date: string
  domain: string
  company: string
}

interface FilterProps {
  filters: Record<string, any> | undefined
  setFilters: (filters: Record<string, any> | undefined) => void
  domainsFilter: IFilter[]
  companiesFilter: IFilter[]
  streetsFilter: IFilter[]
  dateFilters?: IPaymentFilterResponse
}

interface PaginationProps {
  pageData: { pageSize: number; currentPage: number }
  handlePagination: (page: number, pageSize?: number) => void
}

interface ActionProps {
  onViewClick: (p: IExtendedPayment) => void
  onEditClick: (p: IExtendedPayment) => void
  onDelete: (id: string) => void
  deleteLoading: boolean
}

type DebtPerMonth = {
  monthService: string
  totalDue: number
  paid: number
  remaining: number
}

type CompanyWithPayments = {
  companyId: any
  companyName: string
  debtPerMonth: DebtPerMonth[]
  totalDebt: number
}

interface DebtProps {
  debtorCompanies: CompanyWithPayments[]
}

interface ColumnSelectionProps {
  selectedColumns: ServiceType[]
  setSelectedColumns: (cols: ServiceType[]) => void
}

interface StatusProps {
  paymentsError: boolean
  paymentsLoading: boolean
  paymentsFetching: boolean
  currUserLoading: boolean
  currUserFetching: boolean
  currUserError: boolean
  currUserRoles: string[]
}

interface TableEventProps {
  handleTableChange: (
    pagination: { current?: number; pageSize?: number },
    filters: Record<string, any> | undefined,
    sorter: any,
    extra: { action: string }
  ) => void
}

interface PaymentsTableProps {
  sepDomainID?: string

  payments?: IGetPaymentResponse
  statusProps: StatusProps

  filterProps: FilterProps
  paginationProps: PaginationProps
  actionProps: ActionProps
  debtProps: DebtProps
  columnSelectionProps: ColumnSelectionProps
  onSelectPayments: (rows: IExtendedPayment[]) => void
  onSetDeleteItems: (items: PaymentDeleteItem[]) => void
  paymentsDeleteItems: PaymentDeleteItem[]
  selectedPayments: IExtendedPayment[]
  tableEventProps: TableEventProps
}

const getSummaryColumns = (
  columns: ColumnType<IExtendedPayment>[] = [],
  index = 0
): Array<{ column: ColumnType<IExtendedPayment>; index: number }> => {
  let count = index
  return columns.reduce(
    (
      cells: Array<{ column: ColumnType<IExtendedPayment>; index: number }>,
      column
    ) => {
      if ((column as any).children) {
        const nested = getSummaryColumns((column as any).children, count)
        count += (column as any).children.length
        return [...cells, ...nested]
      }
      return [
        ...cells,
        { column: column as ColumnType<IExtendedPayment>, index: count++ },
      ]
    },
    []
  )
}

const getDebtorTooltipColor = (debtor: { totalDebt: number }) => {
  if (debtor.totalDebt > 0 && debtor.totalDebt < 5000) {
    return 'gray'
  } else if (debtor.totalDebt >= 5000 && debtor.totalDebt < 20000) {
    return 'yellow'
  } else if (debtor.totalDebt >= 20000) {
    return 'red'
  }
  return undefined
}

const PaymentsTable: React.FC<PaymentsTableProps> = ({
  sepDomainID,
  payments,
  statusProps,
  filterProps,
  paginationProps,
  actionProps,
  debtProps,
  columnSelectionProps,
  paymentsDeleteItems,
  selectedPayments,
  onSelectPayments,
  onSetDeleteItems,
  tableEventProps,
}) => {
  const router = useRouter()
  const { pathname } = router
  const { data: userResponse } = useGetCurrentUserQuery()
  const userRoles = usePermissions(userResponse)
  const {
    paymentsError,
    paymentsLoading,
    paymentsFetching,
    currUserLoading,
    currUserFetching,
    currUserError,
    currUserRoles,
  } = statusProps

  const {
    filters,
    setFilters,
    domainsFilter,
    companiesFilter,
    streetsFilter,
    dateFilters,
  } = filterProps

  const { pageData, handlePagination } = paginationProps

  const { onViewClick, onEditClick, onDelete, deleteLoading } = actionProps

  const { debtorCompanies } = debtProps

  const { selectedColumns, setSelectedColumns } = columnSelectionProps

  const { handleTableChange } = tableEventProps

  const isDashboard = pathname === AppRoutes.INDEX

  const { useBreakpoint } = Grid

  const screens = useBreakpoint()
  const isMobile = !screens.md

  const isGlobalAdmin = currUserRoles.includes(Roles.GLOBAL_ADMIN)
  const isDomainAdmin = currUserRoles.includes(Roles.DOMAIN_ADMIN)
  const isUser = currUserRoles.includes(Roles.USER)
  const { token } = theme.useToken()
  const isSingleCompanyByData = useMemo(() => {
    const list = payments?.data || []
    const uniqueCompanies = new Set(
      list.map((p) =>
        typeof p.company === 'object' ? p.company.companyName : p.company
      )
    )
    return filters?.company?.length === 1 && uniqueCompanies.size === 1
  }, [payments?.data, filters?.company])
  const isSingleDomainByData = useMemo(() => {
    const list = payments?.data || []
    const uniqueDomains = new Set(
      list.map((p) => (typeof p.domain === 'object' ? p.domain.name : p.domain))
    )
    return filters?.domain?.length === 1 && uniqueDomains.size === 1
  }, [payments?.data, filters?.domain])

  const themeKey = useMemo(
    () =>
      [
        token.colorBgElevated,
        token.colorText,
        token.colorBorderSecondary,
        token.boxShadowSecondary,
        token.colorFillSecondary,
      ].join('|'),
    [
      token.colorBgElevated,
      token.colorText,
      token.colorBorderSecondary,
      token.boxShadowSecondary,
      token.colorFillSecondary,
    ]
  )
  const allColumns: ColumnsType<IExtendedPayment> = useMemo(() => {
    return [
      {
        title: 'Надавач послуг',
        dataIndex: 'domain',
        width: sepDomainID ? 80 : 170,
        filters: sepDomainID ? undefined : domainsFilter,
        filteredValue: filters?.domain || null,
        filterSearch: true,
        render: (domain: { _id: string; name: string }) =>
          sepDomainID ? (
            domain.name
          ) : (
            <Tooltip title="Додати в фільтри">
              <Typography.Link
                onClick={() => setFilters({ ...filters, domain: [domain._id] })}
              >
                {domain.name}
              </Typography.Link>
            </Tooltip>
          ),
        hidden: isSingleDomainByData || isSingleCompanyByData,
      },
      {
        title: 'Компанія',
        dataIndex: 'company',
        width: sepDomainID ? 100 : 140,
        filters: sepDomainID ? undefined : companiesFilter,
        filteredValue: filters?.company || null,
        filterSearch: true,
        render: (
          company: { _id: string; companyName: string },
          _record: IExtendedPayment,
          index: number
        ) => {
          const companyName = company.companyName
          const companyId = company._id
          const debtor = debtorCompanies.find(
            (d) => d.companyName === companyName
          )
          const isFirstOccurrence =
            payments?.data?.findIndex(
              (item) =>
                typeof item.company === 'object' &&
                (item.company as any).companyName === companyName
            ) === index

          const companyLabel = (
            <Tooltip title="Додати в фільтри">
              <Typography.Link
                onClick={() => setFilters({ ...filters, company: [companyId] })}
              >
                {companyName}
              </Typography.Link>
            </Tooltip>
          )
          if (!isUser && debtor && isFirstOccurrence) {
            return (
              <Badge
                count={debtor.totalDebt.toFixed(2)}
                title=""
                color={getDebtorTooltipColor(debtor)}
                overflowCount={Infinity}
                style={{ cursor: 'pointer' }}
                size="small"
              >
                {companyLabel}
              </Badge>
            )
          }
          return companyLabel
        },
        hidden: filters?.company?.lenght === 1,
      },
      {
        title: 'Дата створення',
        dataIndex: 'invoiceCreationDate',
        render: (date: string) => dateToDefaultFormat(date),
        width: sepDomainID ? 70 : 164,
        filters:
          !sepDomainID && dateFilters?.monthFilter
            ? dateFilters.monthFilter
                .filter((f) => f.value != null)
                .map((f) => ({
                  text: toFirstUpperCase(
                    dateToMonth(new Date(2000, Number(f.value) - 1))
                  ),
                  value: `${new Date().getFullYear()}-month-${f.value}`,
                }))
            : [],
        filteredValue: filters?.invoiceCreationDate || null,
      },
      {
        title: 'Тип',
        dataIndex: 'type',
        align: 'center',
        filters: sepDomainID
          ? undefined
          : [
              { text: 'Кредит (Оплата)', value: Operations.Credit },
              { text: 'Дебет (Реалізація)', value: Operations.Debit },
            ],
        filteredValue: filters?.type || null,
        filterMultiple: false,
        children: [
          {
            title: <Tooltip title="Дебет (Реалізація)">Дебет</Tooltip>,
            dataIndex: 'debit',
            align: 'center',
            width: sepDomainID ? 45 : 130,
            render: (_value, payment) =>
              payment.type === Operations.Debit ? (
                renderCurrency(payment.generalSum)
              ) : (
                <span className={s.currency}>-</span>
              ),
            sorter: sepDomainID
              ? undefined
              : (a: IExtendedPayment, b: IExtendedPayment) =>
                  a.generalSum - b.generalSum,
          },
          {
            title: <Tooltip title="Кредит (Оплата)">Кредит</Tooltip>,
            dataIndex: 'credit',
            align: 'center',
            width: sepDomainID ? 45 : 130,
            render: (_value, payment) =>
              payment.type === Operations.Credit ? (
                renderCurrency(payment.generalSum)
              ) : (
                <span className={s.currency}>-</span>
              ),
            sorter: sepDomainID
              ? undefined
              : (a: IExtendedPayment, b: IExtendedPayment) =>
                  a.generalSum - b.generalSum,
          },
        ],
      },
      {
        title: 'За місяць',
        dataIndex: 'monthService',
        align: 'center',
        width: sepDomainID ? 75 : 164,
        render: (
          monthService: Partial<IExtendedPayment> | string | null,
          payment: IExtendedPayment
        ) => {
          let rawDate: any | undefined
          if (typeof monthService === 'string') {
            rawDate = payment.invoiceCreationDate as unknown as string
          } else {
            rawDate =
              (monthService as any)?.date ||
              (payment.invoiceCreationDate as unknown as string)
          }

          const formatted = toFirstUpperCase(dateToMonthYear(rawDate))

          const popoverContent = (
            <List
              size="small"
              dataSource={[
                {
                  label: ServiceName.maintenancePrice,
                  value: (monthService as any)?.rentPrice,
                },
                {
                  label: ServiceName.electricityPrice,
                  value: (monthService as any)?.electricityPrice,
                },
                {
                  label: ServiceName.waterPrice,
                  value: (monthService as any)?.waterPrice,
                },
                {
                  label: ServiceName.waterPart,
                  value: (monthService as any)?.waterPriceTotal,
                },
                {
                  label: ServiceName.garbageCollectorPrice,
                  value: (monthService as any)?.garbageCollectorPrice,
                },
                {
                  label: ServiceName.inflicionPrice,
                  value: (monthService as any)?.inflicionPrice,
                },
              ]}
              renderItem={(item) =>
                !isEmpty(item.value) && (
                  <List.Item>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        width: '100%',
                        gap: 8,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Typography.Text strong>
                        {String(item.value).length > 6 && item.label.length > 12
                          ? item.label.slice(0, 10) + '.'
                          : item.label}
                      </Typography.Text>
                      <Typography.Text>{item.value}</Typography.Text>
                    </div>
                  </List.Item>
                )
              }
            />
          )

          const btn = (
            <Button
              disabled={isEmpty(monthService)}
              block
              style={{
                border: 'none',
                backgroundColor: token.colorFillSecondary,
              }}
            >
              {formatted}
            </Button>
          )

          return isEmpty(monthService) ? (
            btn
          ) : (
            <Tooltip
              key={themeKey}
              color={token.colorBgElevated}
              title={
                <div style={{ color: token.colorText }}>{popoverContent}</div>
              }
              placement="top"
            >
              {btn}
            </Tooltip>
          )
        },
      },
      ...(selectedColumns.map((value) => ({
        title: ServiceName[value],
        dataIndex: value,
        width: 132,
        ellipsis: true,
        render: (_value, payment: IExtendedPayment) => {
          const item = payment.invoice.find((i) => i.type === value)
          const sum = +(item?.sum || item?.price || 0)
          const currency = renderCurrency(sum.toFixed(2))
          return <span>{currency}</span>
        },
        hidden: Boolean(sepDomainID),
        sorter: (a: IExtendedPayment, b: IExtendedPayment) =>
          (a.invoice.find((i) => i.type === value)?.sum || 0) -
          (b.invoice.find((i) => i.type === value)?.sum || 0),
      })) as ColumnType<IExtendedPayment>[]),
      {
        align: 'center',
        fixed: 'right',
        title: '',
        width: 50,
        render: (_value, payment) => (
          <Button
            style={{ padding: 0 }}
            type="link"
            onClick={() => onViewClick(payment)}
          >
            <EyeOutlined />
          </Button>
        ),
      },
      {
        align: 'center',
        fixed: 'right',
        title: '',
        width: 50,
        render: (_value, payment) =>
          userRoles?.isGlobalAdmin && (
            <Button
              style={{ padding: 0 }}
              type="link"
              onClick={() => onEditClick(payment)}
            >
              <EditOutlined />
            </Button>
          ),
      },
      {
        align: 'center',
        fixed: 'right',
        title: '',
        width: 50,
        render: (_value, payment) =>
          userRoles?.isGlobalAdmin && (
            <Popconfirm
              title={`Ви впевнені, що хочете видалити оплату від ${new Date(
                payment.invoiceCreationDate as unknown as string
                ).toLocaleDateString()}?`}
              onConfirm={() => onDelete(payment._id)}
              cancelText="Відміна"
              disabled={deleteLoading}
            >
              <DeleteOutlined />
            </Popconfirm>
          ),
      },
    ]
  }, [
    payments,
    filters,
    selectedColumns,
    debtorCompanies,
    sepDomainID,
    deleteLoading,
    dateFilters,
    domainsFilter,
    companiesFilter,
    onViewClick,
    onEditClick,
    currUserRoles,
    isSingleCompanyByData,
    isMobile,
    themeKey,
  ])

  const visibleColumns = (allColumns as ColumnType<IExtendedPayment>[]).filter(
    (col) => !(col as any).hidden
  )
  const hasRowSelection =
    (isGlobalAdmin || isDomainAdmin) &&
    (pathname === AppRoutes.PAYMENT || Boolean(sepDomainID))

  const summary = useMemo(() => {
    if (!payments?.data?.length) {
      return null
    }
    const totalPayments = payments.totalPayments
    const flatVisibleColumns = getSummaryColumns(
      visibleColumns as ColumnType<IExtendedPayment>[],
      0
    )

    return (
      <Table.Summary>
        <Table.Summary.Row>
          {hasRowSelection && <Table.Summary.Cell index={0} />}
          {flatVisibleColumns.map(({ column, index }) => {
            if (column.dataIndex === 'debit') {
              return (
                <Table.Summary.Cell key={index} index={index} align="center">
                  {renderCurrency(toRoundFixed(totalPayments.debit || 0))}
                </Table.Summary.Cell>
              )
            }
            if (column.dataIndex === 'credit') {
              return (
                <Table.Summary.Cell key={index} index={index} align="center">
                  {renderCurrency(toRoundFixed(totalPayments.credit || 0))}
                </Table.Summary.Cell>
              )
            }
            if (
              Object.values(ServiceType).includes(
                column.dataIndex as ServiceType
              )
            ) {
              return (
                <Table.Summary.Cell key={index} index={index}>
                  {renderCurrency(
                    toRoundFixed(
                      totalPayments[
                        column.dataIndex as keyof typeof totalPayments
                      ] || 0
                    )
                  )}
                </Table.Summary.Cell>
              )
            }
            return <Table.Summary.Cell key={index} index={index} />
          })}
        </Table.Summary.Row>
        <Table.Summary.Row>
          {hasRowSelection && <Table.Summary.Cell index={0} />}
          {flatVisibleColumns.map(({ column, index }) => {
            if (column.dataIndex === 'credit') {
              return null
            }
            if (column.dataIndex === 'debit') {
              return (
                <Table.Summary.Cell
                  key={index}
                  index={index}
                  colSpan={2}
                  align="center"
                >
                  {renderCurrency(
                    toRoundFixed(
                      Number(totalPayments.debit || 0) -
                        Number(totalPayments.credit || 0)
                    )
                  )}
                </Table.Summary.Cell>
              )
            }
            return <Table.Summary.Cell key={index} index={index} />
          })}
        </Table.Summary.Row>
      </Table.Summary>
    )
  }, [payments, visibleColumns, hasRowSelection])

  if (paymentsError || currUserError) {
    return <Alert message="Помилка" type="error" showIcon closable />
  }

  const rowSelection =
    (isGlobalAdmin || isDomainAdmin) &&
    (pathname === AppRoutes.PAYMENT || Boolean(sepDomainID))
      ? {
          selectedRowKeys: selectedPayments.map((i) => i._id),
          preserveSelectedRowKeys: true,

          onChange: (_keys, rows) => {
            onSelectPayments(rows)
            const deleteItems = rows.map((item) => ({
              id: item._id,
              date:
                typeof item.monthService === 'object' &&
                (item.monthService as any)?.date
                  ? String((item.monthService as any).date)
                  : String(item.invoiceCreationDate),
              domain: (item.domain as any)?.name || '',
              company: (item.company as any)?.companyName || '',
            }))
            onSetDeleteItems(deleteItems)
          },

          onSelect: (record, selected) => {
            if (selected) {
              onSelectPayments([...selectedPayments, record])
              onSetDeleteItems([
                ...paymentsDeleteItems,
                {
                  id: record._id,
                  date:
                    typeof record.monthService === 'object' &&
                    (record.monthService as any)?.date
                      ? String((record.monthService as any).date)
                      : String(record.invoiceCreationDate),
                  domain: (record.domain as any)?.name || '',
                  company: (record.company as any)?.companyName || '',
                },
              ])
            } else {
              onSelectPayments(
                selectedPayments.filter((p) => p._id !== record._id)
              )
              onSetDeleteItems(
                paymentsDeleteItems.filter((i) => i.id !== record._id)
              )
            }
          },
        }
      : undefined

  return (
    <Table
      rowKey="_id"
      rowSelection={rowSelection}
      columns={visibleColumns}
      dataSource={payments?.data || []}
      pagination={
        !isDashboard && {
          current: paginationProps.pageData.currentPage,
          total: payments?.total || 0,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          position: ['bottomCenter'],
          onChange: (page, pageSize) => handlePagination(page, pageSize),
        }
      }
      onChange={(pagination, allFilters, sorter, extra) =>
        handleTableChange(pagination, allFilters, sorter, extra)
      }
      scroll={{
        x:
          (pathname === AppRoutes.PAYMENT
            ? 1300 + selectedColumns.length * 132
            : 1300) -
          (payments?.domainsFilter?.length <= 1 ? 200 : 0) -
          (payments?.realEstatesFilter?.length <= 1 ? 200 : 0),
      }}
      summary={() => summary}
      bordered
      locale={{ emptyText: <Empty description="No Data" /> }}
      loading={
        currUserLoading ||
        currUserFetching ||
        paymentsLoading ||
        paymentsFetching
      }
    />
  )
}

export default PaymentsTable
