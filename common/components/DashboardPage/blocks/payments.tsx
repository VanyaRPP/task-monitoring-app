import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/router'
import { message } from 'antd'

import {
  useGetDomainFiltersQuery,
  useGetRealEstateFiltersQuery,
  useGetAddressFiltersQuery,
  useGetDateFiltersQuery,
  useGetDateTreeQuery,
} from '@common/api/filterApi/filter.api'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import {
  useGetAllPaymentsQuery,
  useDeletePaymentMutation,
} from '@common/api/paymentApi/payment.api'
import { useGetDebtorsQuery } from '@common/api/debtorsApi/debtors.api'

import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'

import TableCard from '@components/UI/TableCard'
import PaymentsHeader from '@components/Tables/Payment/Header'
import PaymentsTable from '@components/Tables/Payment/Table'

import { AppRoutes, Operations, ServiceType, Roles } from '@utils/constants'

import {
  TablePaginationConfig,
  FilterValue,
  SorterResult,
  TableCurrentDataSource,
} from 'antd/lib/table/interface'

import { useSelector, useDispatch } from 'react-redux'
import {
  setPage,
  setFilters,
  setDomainsFilter,
  setCompaniesFilter,
  setStreetsFilter,
  setDateFilters,
  setOpenView,
  setOpenEdit,
  setCloseModal,
  setDebtorCompanies,
  setSelectedColumns,
  setPaymentsDeleteItems,
  setSelectedPayments,
  setSelectedDateField,
} from '@modules/store/paymentsSlice'
import { RootState } from '@modules/store/store'
import { formatDateFilterForQuery } from '@utils/helpers'
import { getTypeOperation } from '@utils/helpers'
import { PaymentDeleteItem } from '@components/Tables/Payment/Header'

export interface PaymentsBlockProps {
  sepDomainID?: string
}
interface TableEventProps {
  handleTableChange: (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null> | null,
    sorter: SorterResult<any> | SorterResult<any>[],
    extra: TableCurrentDataSource<any>
  ) => void
}

const parseKey = (val?: string) => {
  if (!val) return null
  const monthMatch = String(val).match(/^(\d{4})-month-(\d{1,2})$/)
  if (monthMatch) return { type: 'month' as const, year: Number(monthMatch[1]), month: Number(monthMatch[2]) }
  const quarterMatch = String(val).match(/^(\d{4})-quarter-(\d)$/)
  if (quarterMatch) return { type: 'quarter' as const, year: Number(quarterMatch[1]), quarter: Number(quarterMatch[2]) }
  return null
}

const PaymentsBlock: React.FC<PaymentsBlockProps> = ({ sepDomainID }) => {
  const router = useRouter()
  const dispatch = useDispatch()
  const {
    filters,
    domainsFilter,
    companiesFilter,
    streetsFilter,
    dateFilters,
    currentPayment,
    edit,
    preview,
    debtorCompanies,
    selectedColumns,
    paymentsDeleteItems,
    selectedPayments,
    selectedDateField,
    currentPage: rawCurrentPage,
    pageSize: rawPageSize,
  } = useSelector((s: RootState) => s.payments)
  const handleView = (p: IExtendedPayment) => dispatch(setOpenView(p))
  const handleEdit = (p: IExtendedPayment) => dispatch(setOpenEdit(p))
  const handleClose = () => dispatch(setCloseModal())

  const currentPage = rawCurrentPage || 1
  const pageSize =
    rawPageSize || (router.pathname === AppRoutes.PAYMENT ? 10 : 5)

  const { data: domainsFiltersData } = useGetDomainFiltersQuery({
    realEstates: filters?.company?.length ? filters.company : undefined,
  })
  const { data: companiesFilterData } = useGetRealEstateFiltersQuery({
    domains: filters?.domain,
    archived: false,
  })
  const { data: dateFiltersData } = useGetDateFiltersQuery({ type: 'payment' })
  const [domainIds, setDomainIds] = useState<string[]>([])
  const { data: streetsFilterData } = useGetAddressFiltersQuery({
    domains: filters?.domain,
  })

  const {
    data: currUser,
    isLoading: currUserLoading,
    isFetching: currUserFetching,
    isError: currUserError,
  } = useGetCurrentUserQuery()

  useEffect(() => {
    const fallback = domainsFiltersData?.domainsFilter?.map((d) => d.value) || []
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
  useEffect(() => {
    if (debtorsData?.companies) {
      dispatch(setDebtorCompanies(debtorsData.companies))
    }
  }, [debtorsData, dispatch])

  const dateTreeQ = useGetDateTreeQuery({
    source: 'monthService',
    domainIds: filters?.domain,
    companyIds: filters?.company,
    streetIds: filters?.street,
  })

const queryParams = useMemo(() => {
  const base = {
    skip: (currentPage - 1) * pageSize,
    limit: pageSize,
  }

  const parseArray = (arr?: string[]) =>
    (arr || []).map((v) => parseKey(v)).filter(Boolean)

  const monthServiceParsed = parseArray(filters?.monthService)
  const invoiceParsed = parseArray(filters?.invoiceCreationDate)

  let dateField: 'invoiceCreationDate' | 'monthService.date' = 'invoiceCreationDate'
  let year: number[] | undefined
  let month: number[] | undefined
  let quarter: number[] | undefined
  let monthService: string[] | undefined

  if (
    Array.isArray(filters?.invoiceCreationDate) &&
    filters.invoiceCreationDate.length === 3 &&
    typeof filters.invoiceCreationDate[0] === 'string'
  ) {
    const [yearVal, type, value] = filters.invoiceCreationDate
    dateField = 'invoiceCreationDate'
    year = [Number(yearVal)]
    if (type === 'month') month = [Number(value)]
    if (type === 'quarter') quarter = [Number(value)]
  } else if (monthServiceParsed.length) {
    dateField = 'monthService.date'
    year = [...new Set(monthServiceParsed.map((p) => p.year))]
    month = monthServiceParsed.filter(p => p.type === 'month').map(p => p.month!)
    quarter = monthServiceParsed.filter(p => p.type === 'quarter').map(p => p.quarter!)
    monthService = filters?.monthService
  } else if (invoiceParsed.length) {
    dateField = 'invoiceCreationDate'
    year = [...new Set(invoiceParsed.map((p) => p.year))]
    month = invoiceParsed.filter(p => p.type === 'month').map(p => p.month!)
    quarter = invoiceParsed.filter(p => p.type === 'quarter').map(p => p.quarter!)
  }

  return {
    ...base,
    year,
    month,
    quarter,
    dateField,
    monthService,
  }
}, [currentPage, pageSize, filters?.monthService, filters?.invoiceCreationDate, filters])

  const apiArgs = {
    ...queryParams,
    ...getTypeOperation(filters?.type?.[0]),
    companyIds: filters?.company || undefined,
    domainIds: sepDomainID || filters?.domain || undefined,
    streetIds: filters?.street || undefined,
  } as any
  apiArgs.dateField = queryParams.dateField as 'invoiceCreationDate' | 'monthService.date'
  const { data: payments, isError: paymentsError, isLoading: paymentsLoading, isFetching: paymentsFetching } = useGetAllPaymentsQuery(apiArgs, { skip: currUserLoading || !currUser })

  const [deletePaymentMutation, { isLoading: deleteLoading }] = useDeletePaymentMutation()

  const handleDeletePayment = useCallback(async (id: string) => {
    const response = await deletePaymentMutation(id)
    if ('data' in response) {
      message.success('Видалено!')
    } else {
      message.error('Помилка при видаленні рахунку')
    }
  }, [deletePaymentMutation])

  useEffect(() => {
    if (domainsFiltersData?.domainsFilter) dispatch(setDomainsFilter(domainsFiltersData.domainsFilter))
    if (companiesFilterData?.realEstatesFilter) dispatch(setCompaniesFilter(companiesFilterData.realEstatesFilter))
    if (streetsFilterData?.streetsFilter) dispatch(setStreetsFilter(streetsFilterData.streetsFilter))

    if (dateTreeQ?.data?.tree) {
      dispatch(setDateFilters({
        ...dateFiltersData,
        tree: dateTreeQ.data.tree,
      }))
    } else {
      dispatch(setDateFilters(dateFiltersData))
    }
  }, [dateTreeQ?.data, dateFiltersData, domainsFiltersData?.domainsFilter, companiesFilterData?.realEstatesFilter, streetsFilterData?.streetsFilter, dispatch])

  const handlePagination = (page: number, pageSizeArg?: number) => dispatch(setPage({ page, pageSize: pageSizeArg ?? pageSize }))

  const handleTableChange = (
  pagination: TablePaginationConfig,
  tableFilters: Record<string, FilterValue | null> | null,
  sorter: SorterResult<any> | SorterResult<any>[],
  extra: TableCurrentDataSource<any>
  ) => {
    if (extra.action === "paginate") {
      dispatch(
        setPage({
          page: pagination.current || 1,
          pageSize: pagination.pageSize,
        })
      )
      return
    }

    if (extra.action === "filter") {
      dispatch(setPage({ page: 1 }))

      const incoming = (tableFilters || {}) as Record<string, any>
      const newFilters = { ...filters, ...incoming }

      delete newFilters.year
      delete newFilters.month
      delete newFilters.quarter

      const parseArray = (arr?: any[]) =>
        (arr || [])
          .map((v) => parseKey(String(v)))
          .filter(Boolean)

      const monthServiceParsed = parseArray(incoming.monthService)
      const invoiceParsed = parseArray(incoming.invoiceCreationDate)

      if (monthServiceParsed.length) {
        dispatch(setSelectedDateField('monthService.date'))

        newFilters.year = [
          ...new Set(monthServiceParsed.map((p) => String(p.year))),
        ]

        const months = monthServiceParsed
          .filter((p) => p.type === "month")
          .map((p) => String(p.month))

        const quarters = monthServiceParsed
          .filter((p) => p.type === "quarter")
          .map((p) => String(p.quarter))

        if (months.length) newFilters.month = months
        if (quarters.length) newFilters.quarter = quarters

        delete newFilters.invoiceCreationDate
        dispatch(setFilters(newFilters))
        return
      }

      if (invoiceParsed.length) {
        dispatch(setSelectedDateField("invoiceCreationDate"))

        newFilters.year = [
          ...new Set(invoiceParsed.map((p) => String(p.year))),
        ]

        const months = invoiceParsed
          .filter((p) => p.type === "month")
          .map((p) => String(p.month))

        const quarters = invoiceParsed
          .filter((p) => p.type === "quarter")
          .map((p) => String(p.quarter))

        if (months.length) newFilters.month = months
        if (quarters.length) newFilters.quarter = quarters

        delete newFilters.monthService
        dispatch(setFilters(newFilters))
        return
      }

      dispatch(setSelectedDateField("invoiceCreationDate"))
      delete newFilters.year
      delete newFilters.month
      delete newFilters.quarter
      delete newFilters.monthService
      delete newFilters.invoiceCreationDate

      dispatch(setFilters(newFilters))
      return
    }

    if (tableFilters) {
      dispatch(setFilters({ ...filters, ...tableFilters }))
    }
  }

  const statusProps = {
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

  const filterProps = {
    filters,
    setFilters: (f) => dispatch(setFilters(f)),
    domainsFilter,
    companiesFilter,
    streetsFilter,
    dateFilters,
  }
  const paginationProps = {
    pageData: { currentPage, pageSize },
    handlePagination,
  }
  const actionProps = {
    onViewClick: handleView,
    onEditClick: handleEdit,
    onDelete: handleDeletePayment,
    deleteLoading,
  }
  const debtProps = {
    debtorCompanies,
  }

  const columnSelectionProps = {
    selectedColumns,
    setSelectedColumns: (cols) => dispatch(setSelectedColumns(cols)),
  }
  const handleColumnsSelect = useCallback(
    (cols: ServiceType[]) => {
      dispatch(setSelectedColumns(cols))
    },
    [dispatch]
  )
  const headerProps: React.ComponentProps<typeof PaymentsHeader> = {
    paymentsDeleteItems,
    closeEditModal: handleClose,
setCurrentDateFilter: (vals) => {
  console.debug('[PaymentsHeader] setCurrentDateFilter vals:', vals)
  dispatch(setSelectedDateField('invoiceCreationDate'))
  dispatch(
    setFilters({
      ...filters,
      invoiceCreationDate: vals,
      dateField: 'invoiceCreationDate',
    })
  )
},
    currentPayment,
    paymentActions: { edit, preview },
    streets: filterProps.streetsFilter,
    payments: payments,
    filters: filterProps.filters,
    setFilters: filterProps.setFilters,
    selectedPayments,
    setSelectedPayments,
    setPaymentsDeleteItems,
    enablePaymentsButton: !sepDomainID,
    onColumnsSelect: (cols: ServiceType[]) =>
      dispatch(setSelectedColumns(cols)),
    domainFilter: filterProps.domainsFilter,
    realEstatesFilter: filterProps.companiesFilter,
    isDashboard: router.pathname === AppRoutes.INDEX,
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
        onSelectPayments={(rows: IExtendedPayment[]) =>
          dispatch(setSelectedPayments(rows))
        }
        onSetDeleteItems={(items: PaymentDeleteItem[]) =>
          dispatch(setPaymentsDeleteItems(items))
        }
      />
    </TableCard>
  )
}

export default PaymentsBlock
