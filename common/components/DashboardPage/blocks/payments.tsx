import { useState, useEffect, useCallback, useMemo } from 'react'
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

  const dateQueryParams = useCallback(() => {
    const monthKeys = filters?.monthService as string[] | undefined
    const invoiceKeys = filters?.invoiceCreationDate as string[] | undefined
    
    if (monthKeys?.length) {
      const parseDate = (key: string) => {
        const match = key.match(/^(\d{4})-month-(\d{1,2})$/)
        return match ? { year: parseInt(match[1]), month: parseInt(match[2]) } : null
      }
      
      const parsed = parseDate(monthKeys[0])
      if (parsed) {
        return {
          year: parsed.year,
          month: parsed.month,
          dateField: 'monthService.date' as const
        }
      }
    }

    if (invoiceKeys?.length) {
      const parseDate = (key: string) => {
        const match = key.match(/^(\d{4})-month-(\d{1,2})$/)
        return match ? { year: parseInt(match[1]), month: parseInt(match[2]) } : null
      }
      
      const parsed = parseDate(invoiceKeys[0])
      if (parsed) {
        return {
          year: parsed.year,
          month: parsed.month,
          dateField: 'invoiceCreationDate' as const
        }
      }
    }

    return {
      dateField: 'invoiceCreationDate' as const
    }
  }, [filters?.monthService, filters?.invoiceCreationDate])

  const queryParams = useMemo(() => {
    const baseParams = {
      skip: (currentPage - 1) * pageSize,
      limit: pageSize,
      dateField: selectedDateField,
    };

    if (filters?.year && filters?.month) {
      return {
        ...baseParams,
        year: filters.year[0],
        month: filters.month[0],
      };
    }

    return baseParams;
  }, [currentPage, pageSize, selectedDateField, filters])

  const {
    data: payments,
    isError: paymentsError,
    isLoading: paymentsLoading,
    isFetching: paymentsFetching,
  } = useGetAllPaymentsQuery(
    {
      ...queryParams,
      ...getTypeOperation(filters?.type?.[0]),
      companyIds: filters?.company || undefined,
      domainIds: sepDomainID || filters?.domain || undefined,
      streetIds: filters?.street || undefined,
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
    tableFilters: Record<string, FilterValue | null> | null,
    sorter: SorterResult<any> | SorterResult<any>[],
    extra: TableCurrentDataSource<any>
  ) => {

    if (extra.action === 'filter') {
      dispatch(setPage({ page: 1 }));

      const currentFilters = filters ? { ...filters } : {};
      const incoming = (tableFilters || {}) as Record<string, any>;
      const newFilters: Record<string, any> = { ...currentFilters, ...incoming };
      delete newFilters.year;
      delete newFilters.month;

      if (Array.isArray(incoming.monthService) && incoming.monthService.length > 0) {
        const key = String(incoming.monthService[0]);
        const match = key.match(/^(\d{4})-month-(\d{1,2})$/);
        if (match) {
          const yearStr = match[1];
          const monthStr = match[2];
          dispatch(setSelectedDateField('monthService.date'));
          newFilters.year = [String(yearStr)];
          newFilters.month = [String(monthStr)];
          delete newFilters.invoiceCreationDate;
        }
      }
      else if (
        Array.isArray(incoming.invoiceCreationDate) &&
        incoming.invoiceCreationDate.length > 0
      ) {
        const key = String(incoming.invoiceCreationDate[0]);
        const match = key.match(/^(\d{4})-month-(\d{1,2})$/);
        if (match) {
          const yearStr = match[1];
          const monthStr = match[2];
          dispatch(setSelectedDateField('invoiceCreationDate'));
          newFilters.year = [String(yearStr)];
          newFilters.month = [String(monthStr)];
          delete newFilters.monthService;
        }
      } else {
        dispatch(setSelectedDateField('invoiceCreationDate'));
        delete newFilters.year;
        delete newFilters.month;
      }
      dispatch(setFilters(newFilters));
      return;
    }

    if (extra.action === 'paginate') {
      dispatch(
        setPage({
          page: pagination.current || 1,
          pageSize: pagination.pageSize,
        })
      );
      return;
    }

    if (tableFilters) {
      dispatch(setFilters({ ...filters, ...tableFilters }));
    }
  };
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
