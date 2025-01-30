import {
  dateToDefaultFormat,
  dateToMonthYear,
} from '@assets/features/formatDate'
import {
  useDeletePaymentMutation,
  useGetAllPaymentsQuery,
} from '@common/api/paymentApi/payment.api'
import {
  useGetAddressFiltersQuery,
  useGetDomainFiltersQuery,
  useGetRealEstateFiltersQuery,
} from '@common/api/filterApi/filter.api'
import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import TableCard from '@components/UI/TableCard'
import {
  AppRoutes,
  Operations,
  PERIOD_FILTR,
  Roles,
} from '@utils/constants'
import {
  renderCurrency,
  toFirstUpperCase,
} from '@utils/helpers'
import {
  Alert,
  TableColumnType,
  message,
  theme,
} from 'antd'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {usePaymentColumns} from "@components/Tables/Payments/usePaymentColumns";
import PaymentsTable, {PaymentDeleteItem} from "@components/Tables/Payments/Table";
import PaymentCardHeader from "@components/Tables/Payments/Header";

interface PaymentsBlockProps {
  sepDomainID?: string
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

function getDateFilter(value) {
  const [, year, period, number] = value || []
  // TODO: add enums
  if (period === PERIOD_FILTR.QUARTER)
    return {
      year,
      quarter: number,
    }
  if (period === PERIOD_FILTR.MONTH)
    return {
      year,
      month: number,
    }
  if (period === PERIOD_FILTR.YEAR) return { year }
}

function getTypeOperation(value) {
  if (value) {
    return {
      type: value === Operations.Debit ? Operations.Debit : Operations.Credit,
    }
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
  const [currentDateFilter, setCurrentDateFilter] = useState()
  const [currentTypeOperation, setCurrentTypeOperation] = useState()
  const [pageData, setPageData] = useState({
    pageSize: router.pathname === AppRoutes.PAYMENT ? 10 : 5,
    currentPage: 1,
  })

  const [selectedColumns, setSelectedColumns] = useState<string[]>([])

  const [filters, setFilters] = useState<any>()

  const { data: domainsFilters } = useGetDomainFiltersQuery({
    realEstates: filters?.company,
  })
  const { data: companiesFilter } = useGetRealEstateFiltersQuery({
    domains: filters?.domain,
  })

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
    isFetching: currUserFetching,
    isLoading: currUserLoading,
    isError: currUserError,
    data: currUser,
  } = useGetCurrentUserQuery()

  const {
    isFetching: paymentsFetching,
    isLoading: paymentsLoading,
    isError: paymentsError,
    data: payments,
  } = useGetAllPaymentsQuery(
    {
      skip: (pageData.currentPage - 1) * pageData.pageSize,
      limit: pageData.pageSize,
      ...getDateFilter(currentDateFilter),
      ...getTypeOperation(currentTypeOperation),
      companyIds: filters?.company || undefined,
      domainIds: sepDomainID || filters?.domain || undefined,
      streetIds: filters?.street || undefined,
      type: filters?.type || undefined,
    },
    { skip: currUserLoading || !currUser }
  )

  const [deletePayment, { isLoading: deleteLoading, isError: deleteError }] =
    useDeletePaymentMutation()
  const isGlobalAdmin = currUser?.roles?.includes(Roles.GLOBAL_ADMIN)
  const isDomainAdmin = currUser?.roles?.includes(Roles.DOMAIN_ADMIN)

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

  const columns = usePaymentColumns({
    domainsFilters,
    companiesFilter,
    setPaymentActions,
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
    setCurrentPayment,
    renderCurrency,
    dateToDefaultFormat,
    dateToMonthYear,
    toFirstUpperCase,
    typeFilters
  })

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
        <PaymentsTable
          onSelect={onSelect}
          columns={columns}
          payments={payments}
          selectedColumns={selectedColumns}
          setPageData={setPageData}
          setFilters={setFilters}
          paymentsDeleteItems={paymentsDeleteItems}
          setPaymentsDeleteItems={setPaymentsDeleteItems}
          setSelectedPayments={setSelectedPayments}
          summaryColumns={summaryColumns}
          paymentsLoading={paymentsLoading}
          paymentsFetching={paymentsFetching}
        />
      )}
    </TableCard>
  )
}

export default PaymentsBlock
