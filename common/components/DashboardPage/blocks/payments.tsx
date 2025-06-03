import React, { useState, useEffect } from 'react'
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

import TableCard from '@components/UI/TableCard'
import PaymentsHeader, {
  PaymentDeleteItem,
} from '@components/Tables/Payment/Header'
import PaymentsTable from '@components/Tables/Payment/Table'

import { AppRoutes, Operations } from '@utils/constants'

export interface PaymentsBlockProps {
  sepDomainID?: string
}

function getTypeOperation(value?: string) {
  if (value === Operations.Debit) {
    return { type: Operations.Debit }
  } else if (value === Operations.Credit) {
    return { type: Operations.Credit }
  }
  return {}
}

function formatDateFilterForQuery(raw?: string[]) {
  if (!raw?.length) {
    return {}
  }
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

const PaymentsBlock: React.FC<PaymentsBlockProps> = ({ sepDomainID }) => {
  const router = useRouter()

  const [currentPayment, setCurrentPayment] =
    useState<Partial<IExtendedPayment> | null>(null)
  const [paymentActions, setPaymentActions] = useState({
    edit: false,
    preview: false,
  })

  const [currentDateFilter, setCurrentDateFilter] = useState<
    string[] | undefined
  >()
  const [currentTypeOperation, setCurrentTypeOperation] = useState<
    string | undefined
  >()
  const [selectedDateField, setSelectedDateField] = useState<
    'invoiceCreationDate' | 'date'
  >('invoiceCreationDate')

  const [pageData, setPageData] = useState({
    pageSize: router.pathname === AppRoutes.PAYMENT ? 10 : 5,
    currentPage: 1,
  })

  const [selectedColumns, setSelectedColumns] = useState<
    Array<keyof IExtendedPayment>
  >([])

  const [filters, setFilters] = useState<Record<string, any> | undefined>()

  const [paymentsDeleteItems, setPaymentsDeleteItems] = useState<
    PaymentDeleteItem[]
  >([])
  const [selectedPayments, setSelectedPayments] = useState<IExtendedPayment[]>(
    []
  )

  const { data: domainsFilters } = useGetDomainFiltersQuery({
    realEstates: filters?.company,
  })
  const { data: companiesFilter } = useGetRealEstateFiltersQuery({
    domains: filters?.domain,
  })
  const { data: dateFilters } = useGetDateFiltersQuery({ type: 'payment' })
  const { data: streetsFilter } = useGetAddressFiltersQuery({
    domains: filters?.domain,
  })

  const {
    data: currUser,
    isLoading: currUserLoading,
    isFetching: currUserFetching,
    isError: currUserError,
  } = useGetCurrentUserQuery()

  const {
    data: payments,
    isError: paymentsError,
    isLoading: paymentsLoading,
    isFetching: paymentsFetching,
  } = useGetAllPaymentsQuery(
    {
      skip: (pageData.currentPage - 1) * pageData.pageSize,
      limit: pageData.pageSize,
      ...formatDateFilterForQuery(currentDateFilter),
      ...getTypeOperation(currentTypeOperation),
      dateField: selectedDateField,
      companyIds: filters?.company || undefined,
      domainIds: sepDomainID || filters?.domain || undefined,
      streetIds: filters?.street || undefined,
      type: filters?.type || undefined,
    },
    { skip: currUserLoading || !currUser }
  )

  const [domainIds, setDomainIds] = useState<string[]>([])
  useEffect(() => {
    const fallbackDomains = domainsFilters?.domainsFilter?.map((d) => d.value)
    if (filters?.domain?.length) {
      setDomainIds(filters.domain)
    } else if (fallbackDomains?.length) {
      setDomainIds(fallbackDomains)
    }
  }, [filters?.domain, domainsFilters])

  const { data: debtorsData } = useGetDebtorsQuery(
    { domainIds },
    { skip: !domainIds.length }
  )
  const debtorCompanies = debtorsData?.companies || []

  const [deletePayment, { isLoading: deleteLoading, isError: deleteError }] =
    useDeletePaymentMutation()

  const handleDeletePayment = async (id: string) => {
    const response = await deletePayment(id)
    if ('data' in response) {
      message.success('Видалено!')
    } else {
      message.error('Помилка при видаленні рахунку')
    }
  }

  const closeEditModal = () => {
    setCurrentPayment(null)
    setPaymentActions({ edit: false, preview: false })
  }

  const handlePagination = (page: number, pageSize?: number) => {
    setPageData({
      pageSize: pageSize ?? pageData.pageSize,
      currentPage: page,
    })
  }

  const handleTableChange = (
    pagination: { current?: number; pageSize?: number },
    allFilters: Record<string, any> | null,
    sorter: any,
    extra: any
  ) => {
    if (extra.action === 'paginate') {
      handlePagination(pagination.current ?? 1, pagination.pageSize)
    }
    if (extra.action === 'filter') {
      setFilters(allFilters ?? undefined)
      const raw = allFilters?.invoiceCreationDate
      const invoiceVals = Array.isArray(raw)
        ? (raw.filter((x) => typeof x === 'string') as string[])
        : []
      setCurrentDateFilter(invoiceVals)
    }
  }

  useEffect(() => {
    if (
      domainsFilters?.domainsFilter instanceof Array &&
      domainsFilters.domainsFilter.length === 1
    ) {
      setFilters((prev = {}) => ({
        ...prev,
        domain: [domainsFilters.domainsFilter[0].value],
      }))
    }

    if (
      companiesFilter?.realEstatesFilter instanceof Array &&
      companiesFilter.realEstatesFilter.length === 1
    ) {
      setFilters((prev = {}) => ({
        ...prev,
        company: [companiesFilter.realEstatesFilter[0].value],
      }))
    }
  }, [domainsFilters, companiesFilter])

  useEffect(() => {
    setPageData((prev) => ({
      ...prev,
      currentPage: 1,
    }))
  }, [filters, currentTypeOperation, currentDateFilter])
  useEffect(() => {
    if (filters?.domain?.length > 0) {
      setCurrentPayment({ domain: { _id: filters.domain[0] } } as any)
    }
  }, [filters])

  return (
    <TableCard
      title={
        <PaymentsHeader
          paymentsDeleteItems={paymentsDeleteItems}
          closeEditModal={closeEditModal}
          setCurrentDateFilter={setCurrentDateFilter}
          currentPayment={currentPayment}
          paymentActions={paymentActions}
          streets={streetsFilter?.streetsFilter || []}
          payments={payments as IGetPaymentResponse}
          filters={filters}
          setFilters={setFilters}
          selectedPayments={selectedPayments}
          setSelectedPayments={setSelectedPayments}
          setPaymentsDeleteItems={setPaymentsDeleteItems}
          enablePaymentsButton={!sepDomainID}
          onColumnsSelect={setSelectedColumns as any}
          domainFilter={domainsFilters?.domainsFilter || []}
          realEstatesFilter={companiesFilter?.realEstatesFilter || []}
        />
      }
    >
      <PaymentsTable
        sepDomainID={sepDomainID}
        payments={payments as IGetPaymentResponse}
        paymentsError={Boolean(paymentsError)}
        filters={filters ?? {}}
        setFilters={setFilters}
        pageData={pageData}
        handlePagination={handlePagination}
        currentDateFilter={currentDateFilter}
        currentTypeOperation={currentTypeOperation}
        selectedDateField={selectedDateField}
        setSelectedDateField={setSelectedDateField}
        selectedColumns={selectedColumns as any}
        deleteLoading={deleteLoading}
        handleDeletePayment={handleDeletePayment}
        streetsFilter={streetsFilter?.streetsFilter || []}
        domainsFilters={domainsFilters}
        companiesFilter={companiesFilter}
        debtorCompanies={debtorCompanies}
        paymentsLoading={paymentsLoading}
        paymentsFetching={paymentsFetching}
        currUserLoading={currUserLoading}
        currUserFetching={currUserFetching}
        currUserError={currUserError}
        currUser={{ roles: currUser?.roles || [] }}
        handleTableChange={handleTableChange}
        onViewClick={(p) => {
          setCurrentPayment(p)
          setPaymentActions({ edit: false, preview: true })
        }}
        onEditClick={(p) => {
          setCurrentPayment(p)
          setPaymentActions({ edit: true, preview: false })
        }}
        dateFilters={dateFilters}
        paymentsDeleteItems={paymentsDeleteItems}
        selectedPayments={selectedPayments}
        setSelectedPayments={setSelectedPayments}
        setPaymentsDeleteItems={setPaymentsDeleteItems}
      />
    </TableCard>
  )
}

export default PaymentsBlock
