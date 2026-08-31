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
  useDeleteMultiplePaymentsMutation,
  paymentApi,
  useMarkPaymentsPaidMutation,
  useDuplicatePaymentsMutation,
  useSendPaymentEmailMutation,
  useUpdatePaymentStatusMutation,
} from '@common/api/paymentApi/payment.api'
import {
  debtorsApi,
  useGetDebtorsQuery,
} from '@common/api/debtorsApi/debtors.api'

import {
  IExtendedPayment,
  PaymentStatus,
} from '@common/api/paymentApi/payment.api.types'

import TableCard from '@components/UI/TableCard'
import PaymentsHeader from '@components/Tables/Payment/Header'
import PaymentsTable from '@components/Tables/Payment/Table'
import ModalDelete from '@components/UI/ModalDelete'

import { AppRoutes, ServiceType, Roles, Operations } from '@utils/constants'
import { dateToDefaultFormat } from '@assets/features/formatDate'

import {
  TablePaginationConfig,
  FilterValue,
  SorterResult,
  TableCurrentDataSource,
} from 'antd/lib/table/interface'

import type { ColumnsType } from 'antd/es/table'
import { useSelector } from 'react-redux'
import { useAppDispatch } from '@modules/store/hooks'
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
import { formatDateFilterForQuery, getTypeOperation } from '@utils/helpers'
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
  const dispatch = useAppDispatch()
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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
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

  const {
    data: payments,
    isError: paymentsError,
    isLoading: paymentsLoading,
    isFetching: paymentsFetching,
    refetch: refetchPayments,
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
      status: filters?.status || undefined,
    },
    { skip: currUserLoading || !currUser }
  )

  useEffect(() => {
    const channel = new BroadcastChannel('payments_sync_channel')

    channel.onmessage = (event) => {
      if (event.data === 'PAYMENT_CREATED') {
        dispatch(paymentApi.util.invalidateTags(['Payment']))
      }
    }

    return () => {
      channel.close()
    }
  }, [dispatch])

  const [deletePaymentMutation, { isLoading: deleteLoading }] =
    useDeletePaymentMutation()
  const [deleteMultiplePayments] = useDeleteMultiplePaymentsMutation()
  const [markPaymentsPaid] = useMarkPaymentsPaidMutation()
  const [duplicatePayments] = useDuplicatePaymentsMutation()
  const [sendPaymentEmail] = useSendPaymentEmailMutation()
  const [updatePaymentStatus] = useUpdatePaymentStatusMutation()
  const patchDebtorsCache = useCallback(
    (changes: Array<{ companyId: string; debtDelta: number }>) => {
      if (!changes.length || !domainIds.length) return
      dispatch(
        debtorsApi.util.updateQueryData(
          'getDebtors',
          { domainIds },
          (draft) => {
            if (!draft.companies) return
            for (const { companyId, debtDelta } of changes) {
              const company = draft.companies.find(
                (c) => c.companyId === companyId
              )
              if (company) {
                company.totalDebt += debtDelta
              }
            }
            draft.companies = draft.companies.filter((c) => c.totalDebt > 0)
          }
        )
      )
    },
    [dispatch, domainIds]
  )
  const getCompanyId = (p: IExtendedPayment): string =>
    typeof p.company === 'object' && p.company
      ? (p.company as any)._id?.toString()
      : String(p.company)
  const debtDeltaForRemoved = (p: IExtendedPayment): number =>
    p.type === Operations.Debit ? -p.generalSum : p.generalSum
  const handleDeletePayment = useCallback(
    async (id: string) => {
      const removed = payments?.data?.find((p) => p._id === id)
      const response = await deletePaymentMutation(id)
      if ('data' in response) {
        if (removed) {
          patchDebtorsCache([
            {
              companyId: getCompanyId(removed),
              debtDelta: debtDeltaForRemoved(removed),
            },
          ])
        }
        message.success('Видалено!')
      } else {
        message.error('Помилка при видаленні рахунку')
      }
    },
    [deletePaymentMutation, patchDebtorsCache, payments]
  )
  const handleMarkPaid = useCallback(
    async (source: IExtendedPayment) => {
      if (source.type === Operations.Credit) {
        message.info('Платіж уже позначено як оплачений')
        return
      }

      const response = await markPaymentsPaid([source._id])
      if ('data' in response && response.data.createdIds.length === 1) {
        patchDebtorsCache([
          { companyId: getCompanyId(source), debtDelta: -source.generalSum },
        ])
        message.success('Платіж позначено як оплачений')
      } else {
        message.error('Не вдалося позначити платіж як оплачений')
      }
    },
    [markPaymentsPaid, patchDebtorsCache]
  )
  const handleBulkMarkPaid = useCallback(
    async (payments: IExtendedPayment[]) => {
      const debitPayments = payments.filter(
        (payment) => payment.type === Operations.Debit
      )
      if (debitPayments.length < 1) {
        message.info('Оберіть щонайменше один дебетовий платіж')
        return
      }

      const response = await markPaymentsPaid(debitPayments.map((p) => p._id))
      if ('data' in response) {
        const { createdIds, skippedIds, totalRequested } = response.data
        const skipped = new Set(skippedIds)
        const succeeded = debitPayments.filter((p) => !skipped.has(p._id))
        patchDebtorsCache(
          succeeded.map((p) => ({
            companyId: getCompanyId(p),
            debtDelta: -p.generalSum,
          }))
        )
        if (createdIds.length === totalRequested) {
          message.success('Платежі позначено як оплачені')
        } else if (createdIds.length > 0) {
          message.warning('Деякі платежі були позначені, але не всі')
        } else {
          message.error('Не вдалося позначити платежі як оплачені')
        }
      } else {
        message.error('Не вдалося позначити платежі як оплачені')
      }
    },
    [markPaymentsPaid, patchDebtorsCache]
  )
  const debtDeltaForAdded = (p: IExtendedPayment): number =>
    -debtDeltaForRemoved(p)

  const runDuplicate = useCallback(
    async (targets: IExtendedPayment[], clearSelection: boolean) => {
      if (targets.length < 1) {
        message.info('Оберіть щонайменше один рахунок')
        return
      }

      const response = await duplicatePayments(targets.map((p) => p._id))
      if ('data' in response) {
        const { createdIds, skippedIds, totalRequested } = response.data
        const skipped = new Set(skippedIds)
        const succeeded = targets.filter((p) => !skipped.has(p._id))
        patchDebtorsCache(
          succeeded.map((p) => ({
            companyId: getCompanyId(p),
            debtDelta: debtDeltaForAdded(p),
          }))
        )
        if (clearSelection) {
          dispatch(setSelectedPayments([]))
          dispatch(setPaymentsDeleteItems([]))
        }
        const many = totalRequested > 1
        if (createdIds.length === totalRequested) {
          message.success(
            many ? 'Рахунки продубльовано' : 'Рахунок продубльовано'
          )
        } else if (createdIds.length > 0) {
          message.warning('Деякі рахунки були не продубльовані')
        } else {
          message.error(
            many
              ? 'Не вдалося продублювати обрані рахунки'
              : 'Не вдалося продублювати рахунок'
          )
        }
      } else {
        message.error('Не вдалося продублювати рахунки')
      }
    },
    [duplicatePayments, patchDebtorsCache, dispatch]
  )

  const handleDuplicate = useCallback(
    (source: IExtendedPayment) => {
      const hasSelection = selectedPayments.length > 0
      const targets = !hasSelection
        ? [source]
        : selectedPayments.some((p) => p._id === source._id)
          ? selectedPayments
          : [...selectedPayments, source]
      return runDuplicate(targets, hasSelection)
    },
    [runDuplicate, selectedPayments]
  )
  const handleBulkDuplicate = useCallback(
    (selected: IExtendedPayment[]) => runDuplicate(selected, true),
    [runDuplicate]
  )
  const handleDeleteConfirm = async () => {
    const idsToDelete = paymentsDeleteItems.map((item) => item.id)
    const requested =
      payments?.data?.filter((p) => idsToDelete.includes(p._id)) ?? []
    const response = await deleteMultiplePayments(idsToDelete)
    if ('data' in response) {
      const { deletedIds } = response.data
      const deletedSet = new Set(deletedIds)
      const actuallyRemoved = requested.filter((p) => deletedSet.has(p._id))
      patchDebtorsCache(
        actuallyRemoved.map((p) => ({
          companyId: getCompanyId(p),
          debtDelta: debtDeltaForRemoved(p),
        }))
      )
      dispatch(setPaymentsDeleteItems([]))
      dispatch(setSelectedPayments([]))
      setDeleteModalOpen(false)
      if (deletedIds.length === idsToDelete.length) {
        message.success('Видалено!')
      } else if (deletedIds.length > 0) {
        message.warning('Деякі платежі видалено, але не всі')
      } else {
        message.error('Не вдалося видалити обрані платежі')
      }
    } else {
      message.error('Помилка при видаленні рахунків')
    }
  }

  const deleteColumns: ColumnsType<PaymentDeleteItem> = [
    {
      title: 'Домен',
      dataIndex: 'domain',
      key: 'domain',
    },
    {
      title: 'Компанія',
      dataIndex: 'company',
      key: 'company',
    },
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      render: (date) =>
        date && date !== 'undefined' ? dateToDefaultFormat(date) : '-',
    },
  ]

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
      const raw = (allFilters as any)?.invoiceCreationDate
      const invoiceVals = Array.isArray(raw)
        ? (raw.filter((x) => typeof x === 'string') as string[])
        : []
      dispatch(
        setFilters({
          ...allFilters,
          invoiceCreationDate: invoiceVals,
          street: filters?.street,
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
    onMarkPaid: handleMarkPaid,
    onDuplicate: handleDuplicate,
    onSendPaymentEmail: async (paymentId: string, html?: string) =>
      sendPaymentEmail({ id: paymentId, html }).unwrap(),
    onUpdatePaymentStatus: async ({
      _id,
      status,
    }: {
      _id: string
      status: PaymentStatus
    }) => updatePaymentStatus({ _id, status }).unwrap(),
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
    onBulkMarkPaid: handleBulkMarkPaid,
    onBulkDuplicate: handleBulkDuplicate,
    onRefresh: () => refetchPayments(),
    isRefreshing: paymentsFetching,
    domainFilter: filterProps.domainsFilter,
    realEstatesFilter: filterProps.companiesFilter,
    isDashboard: router.pathname === AppRoutes.INDEX,
    onDeleteClick: () => setDeleteModalOpen(true),
  }

  return (
    <>
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
      <ModalDelete
        open={deleteModalOpen}
        onCancel={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        data={paymentsDeleteItems}
        columns={deleteColumns}
        rowKey={(item) => item.id}
      />
    </>
  )
}

export default PaymentsBlock
