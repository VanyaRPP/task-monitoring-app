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
  useEffect(() => {
    if (debtorsData?.companies) {
      dispatch(setDebtorCompanies(debtorsData.companies))
    }
  }, [debtorsData, dispatch])

  const {
    data: payments,
    isError: paymentsError,
    isLoading: paymentsLoading,
    isFetching: paymentsFetching,
  } = useGetAllPaymentsQuery(
    {
      skip: (currentPage - 1) * pageSize,
      limit: pageSize,
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
    if (domainsFiltersData?.domainsFilter) {
      dispatch(setDomainsFilter(domainsFiltersData.domainsFilter))
    }
    if (companiesFilterData?.realEstatesFilter) {
      dispatch(setCompaniesFilter(companiesFilterData.realEstatesFilter))
    }
    if (streetsFilterData?.streetsFilter) {
      dispatch(setStreetsFilter(streetsFilterData.streetsFilter))
    }
    dispatch(setDateFilters(dateFiltersData))
  }, [
    dispatch,
    streetsFilterData?.streetsFilter,
    domainsFiltersData?.domainsFilter,
    companiesFilterData?.realEstatesFilter,
    dateFiltersData,
  ])

  const handlePagination = (page: number, pageSizeArg?: number) => {
    dispatch(
      setPage({
        page,
        pageSize: pageSizeArg ?? pageSize,
      })
    )
  }
  const handleTableChange = (
    pagination: TablePaginationConfig,
    allFilters: Record<string, FilterValue | null> | null,
    sorter: SorterResult<any> | SorterResult<any>[],
    extra: TableCurrentDataSource<any>
  ) => {
    if (extra.action === 'paginate') {
      handlePagination(pagination.current, pagination.pageSize)
    }

    if (extra.action === 'filter') {
      dispatch(setFilters(allFilters ?? undefined))
      const raw = (allFilters as any)?.invoiceCreationDate
      const invoiceVals = Array.isArray(raw)
        ? (raw.filter((x) => typeof x === 'string') as string[])
        : []
      dispatch(
        setFilters({
          ...allFilters,
          invoiceCreationDate: invoiceVals,
        })
      )
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

  const headerProps: React.ComponentProps<typeof PaymentsHeader> = {
    paymentsDeleteItems,
    closeEditModal: handleClose,
    setCurrentDateFilter: (vals) => {
      dispatch(
        setFilters({
          ...filters,
          invoiceCreationDate: vals,
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
    <TableCard title={<PaymentsHeader {...headerProps} />}
    style={{ height: '100%' }}>
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
