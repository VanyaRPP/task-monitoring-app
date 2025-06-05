import  { useMemo } from 'react'
import { useRouter } from 'next/router'
import {
  Table,
  Empty,
  Alert,
  Tooltip,
  Typography,
  Button,
  Dropdown,
  Popconfirm,
  Badge,
  theme,
  List,
} from 'antd'
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
} from '@ant-design/icons'
import type { ColumnsType, ColumnType } from 'antd/es/table'

import type {
  IExtendedPayment,
  IGetPaymentResponse,
  IFilter,
} from '@common/api/paymentApi/payment.api.types'
import type { IPaymentFilterResponse } from '@common/api/filterApi/filter.api.types'

import {
  toFirstUpperCase,
  renderCurrency,
  toRoundFixed,
  isEmpty,
} from '@utils/helpers'
import {
  dateToDefaultFormat,
  dateToMonth,
  dateToMonthYear,
} from '@assets/features/formatDate'
import {
  ServiceType,
  ServiceName,
  AppRoutes,
  Roles,
  Operations,
} from '@utils/constants'
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

  paymentsDeleteItems: PaymentDeleteItem[]
  selectedPayments: IExtendedPayment[]
  setSelectedPayments: React.Dispatch<React.SetStateAction<IExtendedPayment[]>>
  setPaymentsDeleteItems: React.Dispatch<
    React.SetStateAction<PaymentDeleteItem[]>
  >

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
  setSelectedPayments,
  setPaymentsDeleteItems,

  tableEventProps,
}) => {
  const router = useRouter()
  const { pathname } = router

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

  const isGlobalAdmin = currUserRoles.includes(Roles.GLOBAL_ADMIN)
  const isDomainAdmin = currUserRoles.includes(Roles.DOMAIN_ADMIN)
  const isUser = currUserRoles.includes(Roles.USER)
  const { token } = theme.useToken()
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
        hidden: payments?.domainsFilter?.length <= 1,
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
        hidden: payments?.realEstatesFilter?.length <= 1,
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
                      }}
                    >
                      <Typography.Text strong>{item.label}</Typography.Text>
                      <Typography.Text>{item.value}</Typography.Text>
                    </div>
                  </List.Item>
                )
              }
            />
          )

          return (
            <Tooltip title={popoverContent} placement="top">
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
        fixed: 'right',
        align: 'center',
        title: '',
        width: sepDomainID ? 25 : 80,
        render: (_value, payment) =>
          payment.type === Operations.Debit && (
            <Button
              style={{ padding: 0 }}
              type="link"
              onClick={() => {
                onViewClick(payment)
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
        width: sepDomainID ? 25 : 80,
        render: (_value, payment) => (
          <Dropdown
            menu={{
              items: [
                {
                  key: 'edit',
                  label: (
                    <Button
                      icon={<EditOutlined />}
                      type="link"
                      style={{ color: '#722ed1', padding: '0 10px' }}
                      onClick={() => onEditClick(payment)}
                    >
                      Редагувати
                    </Button>
                  ),
                },
                (isGlobalAdmin || isDomainAdmin) && {
                  key: 'delete',
                  label: (
                    <Popconfirm
                      title={`Ви впевнені, що хочете видалити оплату від ${new Date(
                        payment.invoiceCreationDate as unknown as string
                      ).toLocaleDateString()}?`}
                      onConfirm={() => onDelete(payment._id)}
                      okText="Видалити"
                      cancelText="Ні"
                      disabled={deleteLoading}
                    >
                      <Button
                        type="text"
                        icon={<DeleteOutlined />}
                        style={{
                          color: '#ff4d4f',
                          padding: '0 10px',
                        }}
                      >
                        Видалити
                      </Button>
                    </Popconfirm>
                  ),
                },
              ].filter(Boolean),
            }}
            placement="bottomRight"
          >
            <Button icon={<MoreOutlined />} />
          </Dropdown>
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
  ])

  const visibleColumns = (allColumns as ColumnType<IExtendedPayment>[]).filter(
    (col) => !(col as any).hidden
  )
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
  }, [payments, visibleColumns])

  if (paymentsError || currUserError) {
    return <Alert message="Помилка" type="error" showIcon closable />
  }

  const rowSelection =
    (isGlobalAdmin || isDomainAdmin) &&
    (pathname === AppRoutes.PAYMENT || Boolean(sepDomainID))
      ? {
          selectedRowKeys: selectedPayments.map((item) => item._id),
          preserveSelectedRowKeys: true,

          onChange: (
            _selectedRowKeys: React.Key[],
            selectedRows: IExtendedPayment[]
          ) => {
            setSelectedPayments(selectedRows)
            const newDeleteItems: PaymentDeleteItem[] = selectedRows.map(
              (item) => ({
                id: item._id,
                date:
                  typeof item.monthService === 'object' &&
                  (item.monthService as any)?.date
                    ? String((item.monthService as any).date)
                    : String(item.invoiceCreationDate),
                domain: (item.domain as any)?.name || '',
                company: (item.company as any)?.companyName || '',
              })
            )
            setPaymentsDeleteItems(newDeleteItems)
          },

          onSelect: (record: IExtendedPayment, selected: boolean) => {
            if (selected) {
              setPaymentsDeleteItems((prev: PaymentDeleteItem[]) => [
                ...prev,
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
              setSelectedPayments((prev: IExtendedPayment[]) => [
                ...prev,
                record,
              ])
            } else {
              setPaymentsDeleteItems((prev: PaymentDeleteItem[]) =>
                prev.filter((item) => item.id !== record._id)
              )
              setSelectedPayments((prev: IExtendedPayment[]) =>
                prev.filter((item) => item._id !== record._id)
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
      pagination={{
        current: paginationProps.pageData.currentPage,
        total: payments?.total || 0,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50'],
        position: ['bottomCenter'],
        onChange: (page, pageSize) => handlePagination(page, pageSize),
      }}
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
