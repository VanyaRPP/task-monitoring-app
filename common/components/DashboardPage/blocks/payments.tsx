import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { message } from 'antd'

import {
  useGetDomainFiltersQuery,
  useGetRealEstateFiltersQuery,
  useGetAddressFiltersQuery,
  useGetDateFiltersQuery,
} from '@common/api/filterApi/filter.api'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import {
  useGetAllPaymentsQuery,
  useDeletePaymentMutation,
} from '@common/api/paymentApi/payment.api'
import { useGetDebtorsQuery } from '@common/api/debtorsApi/debtors.api'

import type {
  IExtendedPayment,
  IGetPaymentResponse,
  IFilter,
} from '@common/api/paymentApi/payment.api.types'
import type { IPaymentFilterResponse } from '@common/api/filterApi/filter.api.types'

import TableCard from '@components/UI/TableCard'
import PaymentsHeader, {
  PaymentDeleteItem,
} from '@components/Tables/Payment/Header'
import PaymentsTable from '@components/Tables/Payment/Table'

import { AppRoutes, Operations, ServiceType, Roles } from '@utils/constants'

import type {
  TablePaginationConfig,
  FilterValue,
  SorterResult,
  TableCurrentDataSource,
} from 'antd/lib/table/interface'

export interface PaymentsBlockProps {
  sepDomainID?: string
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
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null> | null,
    sorter: SorterResult<any> | SorterResult<any>[],
    extra: TableCurrentDataSource<any>
  ) => void
}
function formatDateFilterForQuery(raw?: string[]) {
  if (!raw?.length) return {}
  const numbers = raw
    .map((v) => {
      const leading = parseInt(v, 10)
      if (!isNaN(leading)) {
        const m = v.match(/-(\d+)\s*$/)
        if (m) {
          return [leading, parseInt(m[1], 10)]
        }
        return [leading]
      }
      const n = Number(v)
      return isNaN(n) ? [] : [n]
    })
    .flat()
    .filter((n) => !isNaN(n)) as number[]
  const [year, ...months] = numbers
  const query: any = {}
  if (year != null) {
    query.year = year
  }
  if (months.length === 1) {
    query.month = months[0]
  } else if (months.length > 1) {
    query.month = months
  }
  return query
}
function getTypeOperation(value?: string) {
  if (value === Operations.Debit) {
    return { type: Operations.Debit }
  } else if (value === Operations.Credit) {
    return { type: Operations.Credit }
  }
  return {}
}

const PaymentsBlock: React.FC<PaymentsBlockProps> = ({ sepDomainID }) => {
  const router = useRouter()
  const [currentPayment, setCurrentPayment] =
    useState<Partial<IExtendedPayment> | null>(null)
  const [paymentActions, setPaymentActions] = useState({
    edit: false,
    preview: false,
  })

  const [filters, setFilters] = useState<Record<string, any> | undefined>()
  const [selectedColumns, setSelectedColumns] = useState<ServiceType[]>([])

  const [pageData, setPageData] = useState({
    pageSize: router.pathname === AppRoutes.PAYMENT ? 10 : 5,
    currentPage: 1,
  })

  const [paymentsDeleteItems, setPaymentsDeleteItems] = useState<
    PaymentDeleteItem[]
  >([])
  const [selectedPayments, setSelectedPayments] = useState<IExtendedPayment[]>(
    []
  )
  const [selectedDateField, setSelectedDateField] = useState<
    'invoiceCreationDate' | 'date'
  >('invoiceCreationDate')

  const { data: domainsFiltersData } = useGetDomainFiltersQuery({
    realEstates: filters?.company,
  })
  const { data: companiesFilterData } = useGetRealEstateFiltersQuery({
    domains: filters?.domain,
  })
  const { data: dateFiltersData } = useGetDateFiltersQuery({ type: 'payment' })
  const { data: streetsFilterData } = useGetAddressFiltersQuery({
    domains: filters?.domain,
  })

  const {
    data: currUser,
    isLoading: currUserLoading,
    isFetching: currUserFetching,
    isError: currUserError,
  } = useGetCurrentUserQuery()
  const isGlobalAdmin = currUser?.roles?.includes(Roles.GLOBAL_ADMIN)
  const isDomainAdmin = currUser?.roles?.includes(Roles.DOMAIN_ADMIN)

  const [domainIds, setDomainIds] = useState<string[]>([])
  useEffect(() => {
    const fallback =
      domainsFiltersData?.domainsFilter?.map((d) => d.value) || []
    if (filters?.domain?.length) {
      setDomainIds(filters.domain)
    } else if (fallback.length) {
      setDomainIds(fallback)
    }
  }, [filters?.domain, domainsFiltersData])

  const { data: debtorsData } = useGetDebtorsQuery(
    { domainIds },
    { skip: !domainIds.length }
  )
  const debtorCompanies = debtorsData?.companies || []

  const {
    data: payments,
    isError: paymentsError,
    isLoading: paymentsLoading,
    isFetching: paymentsFetching,
  } = useGetAllPaymentsQuery(
    {
      skip: (pageData.currentPage - 1) * pageData.pageSize,
      limit: pageData.pageSize,
      ...formatDateFilterForQuery(filters?.invoiceCreationDate),
      ...getTypeOperation(filters?.type?.[0]),
      dateField: selectedDateField,
      companyIds: filters?.company || undefined,
      domainIds: sepDomainID || filters?.domain || undefined,
      streetIds: filters?.street || undefined,
      type: filters?.type || undefined,
    },
    { skip: currUserLoading || !currUser }
  )

  const [
    deletePaymentMutation,
    { isLoading: deleteLoading, isError: deleteError },
  ] = useDeletePaymentMutation()

  const handleDeletePayment = useCallback(
    async (id: string) => {
      const response = await deletePaymentMutation(id)
      if ('data' in response) {
        message.success('Видалено!')
      } else {
        message.error('Помилка при видаленні рахунку')
      }
    },
    [deletePaymentMutation]
  )

  useEffect(() => {
    if (domainsFiltersData?.domainsFilter?.length === 1) {
      setFilters((prev = {}) => ({
        ...prev,
        domain: [domainsFiltersData.domainsFilter[0].value],
      }))
    }
    if (companiesFilterData?.realEstatesFilter?.length === 1) {
      setFilters((prev = {}) => ({
        ...prev,
        company: [companiesFilterData.realEstatesFilter[0].value],
      }))
    }
  }, [domainsFiltersData, companiesFilterData])

  const closeEditModal = () => {
    setCurrentPayment(null)
    setPaymentActions({ edit: false, preview: false })
  }

  const handlePagination = (page: number, pageSize?: number) => {
    setPageData({ pageSize: pageSize ?? pageData.pageSize, currentPage: page })
  }

  const handleTableChange = (
    pagination: TablePaginationConfig,
    allFilters: Record<string, FilterValue | null> | null,
    sorter: SorterResult<any> | SorterResult<any>[],
    extra: TableCurrentDataSource<any>
  ) => {
    if (extra.action === 'paginate') {
      setPageData({
        pageSize: pagination.pageSize,
        currentPage: pagination.current,
      })
    }

    if (extra.action === 'filter') {
      setFilters(allFilters ?? undefined)
      const raw = (allFilters as any)?.invoiceCreationDate
      const invoiceVals = Array.isArray(raw)
        ? (raw.filter((x) => typeof x === 'string') as string[])
        : []
      setFilters((prev = {}) => ({ ...prev, invoiceCreationDate: invoiceVals }))
    }
  }

  const statusProps: StatusProps = {
    paymentsError: Boolean(paymentsError),
    paymentsLoading,
    paymentsFetching,
    currUserLoading,
    currUserFetching,
    currUserError,
    currUserRoles: currUser?.roles || [],
  }

  const tableEventProps: TableEventProps = {
    handleTableChange,
  }

  const filterProps: FilterProps = {
    filters,
    setFilters,
    domainsFilter: domainsFiltersData?.domainsFilter || [],
    companiesFilter: companiesFilterData?.realEstatesFilter || [],
    streetsFilter: streetsFilterData?.streetsFilter || [],
    dateFilters: dateFiltersData,
  }

  const paginationProps: PaginationProps = {
    pageData,
    handlePagination: (page, pageSize) =>
      setPageData({ pageSize: pageSize, currentPage: page }),
  }

  const actionProps: ActionProps = {
    onViewClick: (p: IExtendedPayment) => {
      setCurrentPayment(p)
      setPaymentActions({ edit: false, preview: true })
    },
    onEditClick: (p: IExtendedPayment) => {
      setCurrentPayment(p)
      setPaymentActions({ edit: true, preview: false })
    },
    onDelete: handleDeletePayment,
    deleteLoading,
  }

  const debtProps: DebtProps = {
    debtorCompanies,
  }

  const columnSelectionProps: ColumnSelectionProps = {
    selectedColumns,
    setSelectedColumns,
  }

  const headerProps: React.ComponentProps<typeof PaymentsHeader> = {
    paymentsDeleteItems,
    closeEditModal: closeEditModal,
    setCurrentDateFilter: (vals: string[] | undefined) => {
      setFilters((prev = {}) => ({ ...prev, invoiceCreationDate: vals }))
    },
    currentPayment,
    paymentActions,
    streets: filterProps.streetsFilter,
    payments: payments,
    filters: filterProps.filters,
    setFilters: filterProps.setFilters,
    selectedPayments,
    setSelectedPayments,
    setPaymentsDeleteItems,
    enablePaymentsButton: !sepDomainID,
    onColumnsSelect: (cols: ServiceType[]) => setSelectedColumns(cols),

    domainFilter: filterProps.domainsFilter,
    realEstatesFilter: filterProps.companiesFilter,
  }

  return (
    <TableCard title={<PaymentsHeader {...headerProps} />}>
      <PaymentsTable
        sepDomainID={sepDomainID}
        payments={payments}
        statusProps={statusProps}
        tableEventProps={tableEventProps}
        filterProps={filterProps}
        paginationProps={paginationProps}
        actionProps={actionProps}
        debtProps={debtProps}
        columnSelectionProps={columnSelectionProps}
        paymentsDeleteItems={paymentsDeleteItems}
        selectedPayments={selectedPayments}
        setSelectedPayments={setSelectedPayments}
        setPaymentsDeleteItems={setPaymentsDeleteItems}
      />
    </TableCard>
  )
}

export default PaymentsBlock
