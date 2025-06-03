import React, { useMemo } from 'react'
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
  Popover,
  List,
} from 'antd'
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
} from '@ant-design/icons'

import type {
  IExtendedPayment,
  IGetPaymentResponse,
  IFilter,
  IPaymentField,
} from '@common/api/paymentApi/payment.api.types'
import type { IPaymentFilterResponse } from '@common/api/filterApi/filter.api.types'
import type { ColumnType as TableColumnType } from 'antd/es/table'

import { ServiceType } from '@utils/constants'
import { AppRoutes, Roles, Operations, ServiceName } from '@utils/constants'
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
import { theme } from 'antd'
import s from './style.module.scss'
import { IPayment } from '@common/api/paymentApi/payment.api.types'

export interface Props {
  sepDomainID?: string

  payments?: IGetPaymentResponse
  paymentsError: boolean

  filters: Record<string, any> | null
  setFilters: (filters: Record<string, any> | null) => void

  pageData: { pageSize: number; currentPage: number }
  handlePagination: (page: number, pageSize?: number) => void

  currentDateFilter: string[] | undefined
  currentTypeOperation: string | undefined
  setSelectedServices?: (service: IPayment[]) => void

  selectedDateField: 'invoiceCreationDate' | 'date'
  setSelectedDateField: (field: 'invoiceCreationDate' | 'date') => void

  selectedColumns: ServiceType[]

  deleteLoading: boolean
  deleteError: boolean
  handleDeletePayment: (id: string) => void

  streetsFilter: IFilter[]
  domainsFilters?: IPaymentFilterResponse
  companiesFilter?: IPaymentFilterResponse

  debtorCompanies: Array<{
    companyId: any
    companyName: string
    debtPerMonth: Array<{
      monthService: string
      totalDue: number
      paid: number
      remaining: number
    }>
    totalDebt: number
  }>

  paymentsLoading: boolean
  paymentsFetching: boolean

  currUserLoading: boolean
  currUserFetching: boolean
  currUserError: boolean
  currUser: { roles: string[] }

  handleTableChange: (
    pagination: { current?: number; pageSize?: number },
    filters: Record<string, any> | null,
    sorter: any,
    extra: { action: string }
  ) => void

  onViewClick: (payment: IExtendedPayment) => void
  onEditClick: (payment: IExtendedPayment) => void

  dateFilters?: IPaymentFilterResponse
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

const PaymentsTable: React.FC<Props> = ({
  sepDomainID,
  payments,
  paymentsError,
  filters,
  setFilters,
  pageData,
  handlePagination,
  currentDateFilter,
  currentTypeOperation,
  setSelectedDateField,
  selectedColumns,
  deleteLoading,
  deleteError,
  handleDeletePayment,
  streetsFilter,
  domainsFilters,
  companiesFilter,
  debtorCompanies,
  paymentsLoading,
  paymentsFetching,
  currUserLoading,
  currUserFetching,
  currUserError,
  currUser,
  handleTableChange,
  onViewClick,
  onEditClick,
  dateFilters,
  setSelectedServices,
}) => {
  const isGlobalAdmin = currUser.roles.includes(Roles.GLOBAL_ADMIN)
  const isDomainAdmin = currUser.roles.includes(Roles.DOMAIN_ADMIN)
  const isUser = currUser.roles.includes(Roles.USER)
  const { token } = theme.useToken()

  const columns: TableColumnType<IExtendedPayment>[] = useMemo(() => {
    return [
      {
        title: 'Надавач послуг',
        width: sepDomainID ? 80 : 170,
        dataIndex: 'domain',
        filters: sepDomainID ? undefined : domainsFilters?.domainsFilter || [],
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
        hidden:
          !domainsFilters?.domainsFilter ||
          domainsFilters.domainsFilter.length <= 1,
      },
      {
        title: 'Компанія',
        dataIndex: 'company',
        width: sepDomainID ? 100 : 140,
        filters: sepDomainID
          ? undefined
          : companiesFilter?.realEstatesFilter || [],
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
        hidden:
          !companiesFilter?.realEstatesFilter ||
          companiesFilter.realEstatesFilter.length <= 1,
      },
      {
        title: 'Дата створення',
        dataIndex: 'invoiceCreationDate',
        render: (date: string) => dateToDefaultFormat(date),
        width: sepDomainID ? 70 : 164,
        filters:
          !sepDomainID && Array.isArray(dateFilters?.monthFilter)
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
              : (a, b) => a.generalSum - b.generalSum,
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
              : (a, b) => a.generalSum - b.generalSum,
          },
        ],
      },
      {
        title: 'За місяць',
        dataIndex: 'monthService',
        align: 'center',
        width: sepDomainID ? 75 : 164,
        render: (
          monthService: Partial<IPaymentField> | string | null,
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
            <Popover content={popoverContent} placement="top">
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
            </Popover>
          )
        },
      },
      ...selectedColumns.map((value) => ({
        title: ServiceName[value],
        dataIndex: value,
        width: 132,
        ellipsis: true,
        render: (_value, payment) => {
          const item = payment.invoice.find((i) => i.type === value)
          const sum = +(item?.sum || item?.price || 0)
          const currency = renderCurrency(sum.toFixed(2))
          return (
            <span style={currency === '-' ? { color: '#999' } : {}}>
              {currency}
            </span>
          )
        },
        hidden: Boolean(sepDomainID),
        sorter: (a, b) =>
          (a.invoice.find((i) => i.type === value)?.sum || 0) -
          (b.invoice.find((i) => i.type === value)?.sum || 0),
      })),
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
                      style={{
                        color: '#722ed1',
                        paddingLeft: '10px',
                        paddingRight: '10px',
                      }}
                      onClick={() => {
                        onEditClick(payment)
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
                      title={`Ви впевнені, що хочете видалити оплату від ${new Date(
                        payment.invoiceCreationDate as unknown as string
                      ).toLocaleDateString()}?`}
                      onConfirm={() => handleDeletePayment(payment._id)}
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
    domainsFilters,
    companiesFilter,
    onViewClick,
    onEditClick,
  ])

  const dataSource = payments?.data || []
  const total = payments?.total || 0

  const scrollX =
    (window.location.pathname === AppRoutes.PAYMENT
      ? 1300 + selectedColumns.length * 132
      : 1300) -
    ((domainsFilters?.domainsFilter?.length ?? 0) <= 1 ? 200 : 0) -
    ((companiesFilter?.realEstatesFilter?.length ?? 0) <= 1 ? 200 : 0)

  const summary = () => {
    if (dataSource.length === 0) {
      return null
    }
    const summaryColumns = columns.map((col, idx) => ({
      column: col,
      index: idx,
    }))

    return (
      <Table.Summary>
        <Table.Summary.Row>
          {summaryColumns.map(({ column, index }) =>
            column.dataIndex === 'debit' ? (
              <Table.Summary.Cell key={index} index={index} align="center">
                {renderCurrency(
                  toRoundFixed(payments?.totalPayments?.debit || 0)
                )}
              </Table.Summary.Cell>
            ) : column.dataIndex === 'credit' ? (
              <Table.Summary.Cell key={index} index={index} align="center">
                {renderCurrency(
                  toRoundFixed(payments?.totalPayments?.credit || 0)
                )}
              </Table.Summary.Cell>
            ) : (
              <Table.Summary.Cell key={index} index={index}>
                {Object.values(ServiceType).includes(
                  column.dataIndex as ServiceType
                )
                  ? renderCurrency(
                      toRoundFixed(
                        payments?.totalPayments?.[
                          column.dataIndex as keyof typeof payments.totalPayments
                        ] || 0
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
    )
  }

  if (paymentsError || currUserError) {
    return <Alert message="Помилка" type="error" showIcon closable />
  }

  return (
    <Table
      rowKey="_id"
      rowSelection={
        (currUser.roles.includes(Roles.GLOBAL_ADMIN) ||
          currUser.roles.includes(Roles.DOMAIN_ADMIN)) &&
        (window.location.pathname === AppRoutes.PAYMENT || Boolean(sepDomainID))
          ? {
              onChange: (
                _selectedRowKeys: React.Key[],
                selectedRows: IExtendedPayment[]
              ) => {
                if (setSelectedServices) {
                  setSelectedServices(selectedRows)
                }
              },

              onSelect: (
                _record: IExtendedPayment,
                _selected: boolean,
                selectedRows: IExtendedPayment[]
              ) => {
                if (setSelectedServices) {
                  setSelectedServices(selectedRows)
                }
              },
            }
          : undefined
      }
      columns={columns}
      dataSource={dataSource}
      pagination={{
        current: pageData.currentPage,
        total,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50'],
        position: ['bottomCenter'],
        onChange: handlePagination,
      }}
      onChange={handleTableChange}
      scroll={{ x: scrollX }}
      summary={summary}
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
