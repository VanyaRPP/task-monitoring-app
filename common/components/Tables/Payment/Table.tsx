import React, { useMemo } from 'react'
import { Alert, Empty, Table } from 'antd'
import { ColumnType } from 'antd/es/table'
import { useRouter } from 'next/router'
import { IPaymentFilterResponse } from '@common/api/filterApi/filter.api.types'
import {
  IExtendedPayment,
  IFilter,
  IGetPaymentResponse,
} from '@common/api/paymentApi/payment.api.types'
import { AppRoutes, Roles, ServiceType } from '@utils/constants'
import { usePaymentColumns, CompanyWithPayments } from './usePaymentColumns'
import PaymentTableSummary from './PaymentTableSummary'
import { useGetCustomServicesQuery } from '@common/api/customServicesApi/customServices.api'
import {
  ICustomServiceItem,
  extractDomainsFromRealEstates,
  getVisibleServices,
} from '@utils/servicesVisibility'

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
  onMarkPaid: (p: IExtendedPayment) => void
  onDuplicate: (p: IExtendedPayment) => void
  onSendPaymentEmail: (
    paymentId: string,
    html?: string
  ) => Promise<{ success: boolean }>
  onUpdatePaymentStatus: (args: {
    _id: string
    status: 'draft' | 'sent'
  }) => Promise<unknown>
  deleteLoading: boolean
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

  const {
    paymentsError,
    paymentsLoading,
    paymentsFetching,
    currUserLoading,
    currUserFetching,
    currUserError,
    currUserRoles,
  } = statusProps

  const { filters, setFilters, domainsFilter, companiesFilter, dateFilters } =
    filterProps
  const { pageData, handlePagination } = paginationProps
  const {
    onViewClick,
    onEditClick,
    onDelete,
    onMarkPaid,
    onDuplicate,
    onSendPaymentEmail,
    onUpdatePaymentStatus,
    deleteLoading,
  } = actionProps
  const { debtorCompanies } = debtProps
  const { selectedColumns } = columnSelectionProps
  const { handleTableChange } = tableEventProps

  const isGlobalAdmin = currUserRoles.includes(Roles.GLOBAL_ADMIN)
  const isDomainAdmin = currUserRoles.includes(Roles.DOMAIN_ADMIN)
  const isUser = currUserRoles.includes(Roles.USER)

  const { data: customServicesData } = useGetCustomServicesQuery({})
  const allCustomServices = useMemo(
    () => (customServicesData?.data ?? []) as ICustomServiceItem[],
    [customServicesData?.data]
  )

  const visibleDomains = useMemo(
    () =>
      extractDomainsFromRealEstates(
        payments?.data?.map((p) => ({ domain: p.domain })) ?? []
      ),
    [payments?.data]
  )

  const visibleCustomServices = useMemo(
    () => getVisibleServices(currUserRoles, visibleDomains, allCustomServices),
    [currUserRoles, visibleDomains, allCustomServices]
  )

  const allColumns = usePaymentColumns({
    sepDomainID,
    filters,
    setFilters,
    domainsFilter,
    companiesFilter,
    dateFilters,
    debtorCompanies,
    selectedColumns,
    payments,
    isGlobalAdmin,
    isDomainAdmin,
    isUser,
    onViewClick,
    onEditClick,
    onDelete,
    onMarkPaid,
    onDuplicate,
    onSendPaymentEmail,
    onUpdatePaymentStatus,
    deleteLoading,
    visibleCustomServices,
  })

  const visibleColumns = (allColumns as ColumnType<IExtendedPayment>[]).filter(
    (col) => !(col as any).hidden
  )

  const hasRowSelection =
    (isGlobalAdmin || isDomainAdmin) &&
    (pathname === AppRoutes.PAYMENT || Boolean(sepDomainID))

  if (paymentsError || currUserError) {
    return <Alert message="Помилка" type="error" showIcon closable />
  }

  const rowSelection = hasRowSelection
    ? {
        columnWidth: 28,
        selectedRowKeys: selectedPayments.map((i) => i._id),
        preserveSelectedRowKeys: true,
        onChange: (_keys: React.Key[], rows: IExtendedPayment[]) => {
          onSelectPayments(rows)
          onSetDeleteItems(
            rows.map((item) => ({
              id: item._id,
              date: item.invoiceCreationDate
                ? String(item.invoiceCreationDate)
                : '',
              domain: (item.domain as any)?.name || '',
              company: (item.company as any)?.companyName || '',
            }))
          )
        },
        onSelect: (record: IExtendedPayment, selected: boolean) => {
          if (selected) {
            onSelectPayments([...selectedPayments, record])
            onSetDeleteItems([
              ...paymentsDeleteItems,
              {
                id: record._id,
                date: record.invoiceCreationDate
                  ? String(record.invoiceCreationDate)
                  : '',
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
        pathname !== AppRoutes.INDEX && {
          current: pageData.currentPage,
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
      summary={() => (
        <PaymentTableSummary
          payments={payments}
          visibleColumns={visibleColumns}
          hasRowSelection={hasRowSelection}
        />
      )}
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

PaymentsTable.displayName = 'PaymentsTable'

export default PaymentsTable
