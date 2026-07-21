import React, { useMemo, useEffect, useState } from 'react'
import { Badge, Button, List, Tooltip, Typography, theme } from 'antd'
import { ColumnType, ColumnsType } from 'antd/es/table'
import { IPaymentFilterResponse } from '@common/api/filterApi/filter.api.types'
import {
  IExtendedPayment,
  IFilter,
  IGetPaymentResponse,
} from '@common/api/paymentApi/payment.api.types'
import {
  dateToDefaultFormat,
  dateToMonth,
  dateToMonthYear,
} from '@assets/features/formatDate'
import { Operations, ServiceName, ServiceType } from '@utils/constants'
import {
  formatDebt,
  getDebtorTooltipColor,
  isEmpty,
  renderCurrency,
  toFirstUpperCase,
} from '@utils/helpers'
import TableFilterLink from '@components/UI/Reusable/TableFilterLink'
import DateFilterDropdown from './DateFilter/DateFilterDropdown'
import PaymentDropdown from '@components/PaymentDropDown'
import s from './style.module.scss'

export type DebtPerMonth = {
  monthService: string
  totalDue: number
  paid: number
  remaining: number
}

export type CompanyWithPayments = {
  companyId: any
  companyName: string
  debtPerMonth: DebtPerMonth[]
  totalDebt: number
}

interface Params {
  sepDomainID?: string
  filters: Record<string, any> | undefined
  setFilters: (filters: Record<string, any> | undefined) => void
  domainsFilter: IFilter[]
  companiesFilter: IFilter[]
  dateFilters?: IPaymentFilterResponse
  debtorCompanies: CompanyWithPayments[]
  selectedColumns: ServiceType[]
  payments?: IGetPaymentResponse
  isGlobalAdmin: boolean
  isDomainAdmin: boolean
  isUser: boolean
  onViewClick: (p: IExtendedPayment) => void
  onEditClick: (p: IExtendedPayment) => void
  onDelete: (id: string) => void
  onMarkPaid: (p: IExtendedPayment) => void
  onDuplicate: (p: IExtendedPayment) => void
  deleteLoading: boolean
}

function widenFilterDropdown(w = 240) {
  return (open: boolean) => {
    if (!open) return
    requestAnimationFrame(() => {
      document
        .querySelectorAll<HTMLElement>('.ant-table-filter-dropdown')
        .forEach((el) => {
          el.style.width = `${w}px`
          el.style.maxWidth = '90vw'
          el.querySelectorAll<HTMLElement>('.ant-checkbox + span').forEach(
            (span) => {
              span.style.whiteSpace = 'normal'
              span.style.wordBreak = 'break-word'
              span.style.lineHeight = '1.2'
              span.style.display = 'inline-block'
              span.style.maxWidth = '100%'
            }
          )
        })
    })
  }
}

const CustomName = 'custom-name:'

// Custom services are identified by their invoice `name` — the same key the
// payments filter (ColumnSelect) uses — so the table columns and the filter
// options are always derived from the same source and stay in sync. Only names
// with a non-zero sum are surfaced (a 0-sum line renders no column). The
// payments are already domain-narrowed server-side, so this list is implicitly
// scoped to the selected domain(s).
export function getInvoiceCustomServiceNames({
  payments,
}: {
  payments?: IGetPaymentResponse
}): string[] {
  if (!payments?.data?.length) return []

  const order: string[] = []
  const seenNames = new Set<string>()

  payments.data.forEach((payment) => {
    payment.invoice?.forEach((field) => {
      if (field.type !== ServiceType.Custom) return
      const sum = Number(field.sum ?? field.price ?? 0)

      if (sum === 0) return
      const label = field.name?.trim()
      if (!label || seenNames.has(label)) return
      seenNames.add(label)
      order.push(label)
    })
  })

  return order
}

export function buildAutoCustomColumns({
  payments,
  sepDomainID,
  selectedColumns,
}: {
  payments?: IGetPaymentResponse
  sepDomainID?: string
  selectedColumns?: string[]
}): ColumnType<IExtendedPayment>[] {
  const names = getInvoiceCustomServiceNames({ payments })
  const visible = selectedColumns
    ? names.filter((label) => selectedColumns.includes(label))
    : names

  return visible.map((label) => {
    const matches = (field: IExtendedPayment['invoice'][number]) =>
      field.type === ServiceType.Custom && field.name === label
    const sumFor = (payment: IExtendedPayment) =>
      payment.invoice?.reduce(
        (acc, field) =>
          matches(field) ? acc + Number(field.sum ?? field.price ?? 0) : acc,
        0
      ) ?? 0

    return {
      title: label,
      dataIndex: `${CustomName}${label}`,
      width: 132,
      ellipsis: true,
      hidden: Boolean(sepDomainID),
      render: (_value: unknown, payment: IExtendedPayment) => (
        <span>{renderCurrency(sumFor(payment).toFixed(2))}</span>
      ),
      sorter: (a: IExtendedPayment, b: IExtendedPayment) =>
        sumFor(a) - sumFor(b),
    }
  })
}

export function usePaymentColumns({
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
  deleteLoading,
}: Params): ColumnsType<IExtendedPayment> {
  const { token } = theme.useToken()

  const isSingleCompanyByData = useMemo(
    () => companiesFilter?.length === 1,
    [companiesFilter]
  )

  const themeKey = useMemo(
    () =>
      [
        token.colorBgElevated,
        token.colorText,
        token.colorBorderSecondary,
        token.boxShadowSecondary,
        token.colorFillSecondary,
      ].join('|'),
    [
      token.colorBgElevated,
      token.colorText,
      token.colorBorderSecondary,
      token.boxShadowSecondary,
      token.colorFillSecondary,
    ]
  )

  return useMemo<ColumnsType<IExtendedPayment>>(
    () => [
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
            <TableFilterLink
              label={domain?.name}
              filterKey="domain"
              filterId={domain?._id}
              filters={filters}
              setFilters={setFilters}
            />
          ),
        hidden: isDomainAdmin
          ? isSingleCompanyByData && !filters?.company
          : false,
      },
      {
        title: 'Компанія',
        dataIndex: 'company',
        width: sepDomainID ? 100 : 140,
        filters: sepDomainID ? undefined : companiesFilter,
        filteredValue: filters?.company || null,
        filterSearch: true,
        onFilterDropdownOpenChange: widenFilterDropdown(240),
        render: (
          company: { _id: string; companyName: string },
          _record: IExtendedPayment,
          index: number
        ) => {
          if (!company) return null
          const companyName = company?.companyName
          const companyId = company?._id
          const debtor = debtorCompanies.find(
            (d) => d.companyName === companyName
          )
          const isFirstOccurrence =
            payments?.data?.findIndex(
              (item) =>
                item.company != null &&
                typeof item.company === 'object' &&
                (item.company as any).companyName === companyName
            ) === index

          const companyLabel = (
            <TableFilterLink
              label={companyName}
              filterKey="company"
              filterId={companyId}
              filters={filters}
              setFilters={setFilters}
            />
          )

          const hasDebt = Boolean(
            !isUser && debtor && isFirstOccurrence && debtor.totalDebt > 1
          )

          return (
            <Badge
              count={hasDebt && debtor ? formatDebt(debtor.totalDebt) : 0}
              title=""
              color={debtor ? getDebtorTooltipColor(debtor) : '#d9d9d9'}
              overflowCount={Infinity}
              style={{ cursor: 'pointer' }}
              size="small"
            >
              {companyLabel}
            </Badge>
          )
        },
        hidden: isDomainAdmin
          ? isSingleCompanyByData && !filters?.domain
          : false,
      },
      {
        title: 'Дата створення',
        dataIndex: 'invoiceCreationDate',
        render: (date: string) => dateToDefaultFormat(date),
        width: sepDomainID ? 70 : 170,
        filters:
          !sepDomainID && dateFilters
            ? (() => {
                const monthItems = (dateFilters.monthFilter ?? [])
                  .filter((f) => f.value != null)
                  .map((f) => ({
                    num: Number(f.value),
                    label: toFirstUpperCase(
                      dateToMonth(new Date(2000, Number(f.value) - 1))
                    ),
                  }))

                const MIN_YEAR = 2025
                const currentYear = new Date().getFullYear()
                const backendYears: number[] = (dateFilters.yearFilter ?? [])
                  .filter((y) => y?.value != null)
                  .map((y) => Number(y.value))

                const years = Array.from(
                  new Set([
                    ...backendYears,
                    ...Array.from(
                      { length: currentYear - MIN_YEAR + 1 },
                      (_, i) => currentYear - i
                    ),
                  ])
                ).sort((a, b) => b - a)

                return years.map((y) => ({
                  text: String(y),
                  value: String(y),
                  children: monthItems.map((m) => ({
                    text: m.label,
                    value: `${y}-month-${m.num}`,
                  })),
                }))
              })()
            : [],
        filteredValue: filters?.invoiceCreationDate || null,
        filterDropdown: (ddProps) => (
          <DateFilterDropdown
            data={(ddProps.filters as any) ?? []}
            {...ddProps}
          />
        ),
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
          const rawDate =
            typeof monthService === 'string'
              ? (payment.invoiceCreationDate as unknown as string)
              : ((monthService as any)?.date ??
                (payment.invoiceCreationDate as unknown as string))

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
                        gap: 8,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Typography.Text strong>
                        {String(item.value).length > 6 && item.label.length > 12
                          ? item.label.slice(0, 10) + '.'
                          : item.label}
                      </Typography.Text>
                      <Typography.Text>{item.value}</Typography.Text>
                    </div>
                  </List.Item>
                )
              }
            />
          )

          const btn = (
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
          )

          return isEmpty(monthService) ? (
            btn
          ) : (
            <Tooltip
              key={themeKey}
              color={token.colorBgElevated}
              title={
                <div style={{ color: token.colorText }}>{popoverContent}</div>
              }
              placement="top"
            >
              {btn}
            </Tooltip>
          )
        },
      },
      ...(selectedColumns
        .filter((value) => value !== ServiceType.Custom && value in ServiceName)
        .map((value) => {
          const findItem = (payment: IExtendedPayment) =>
            payment.invoice.find((i) => i.type === value)
          return {
            title: ServiceName[value],
            dataIndex: value,
            width: 132,
            ellipsis: true,
            render: (_value, payment: IExtendedPayment) => {
              const item = findItem(payment)
              const sum = +(item?.sum || item?.price || 0)
              return <span>{renderCurrency(sum.toFixed(2))}</span>
            },
            hidden: Boolean(sepDomainID),
            sorter: (a: IExtendedPayment, b: IExtendedPayment) =>
              (findItem(a)?.sum || 0) - (findItem(b)?.sum || 0),
          }
        }) as ColumnType<IExtendedPayment>[]),
      ...(buildAutoCustomColumns({
        payments,
        sepDomainID,
        selectedColumns,
      }) as ColumnType<IExtendedPayment>[]),
      {
        align: 'center',
        fixed: 'right',
        title: '',
        width: 48,
        render: (_value, payment: IExtendedPayment) => (
          <PaymentDropdown
            payment={payment}
            isAdmin={isGlobalAdmin || isDomainAdmin}
            onView={onViewClick}
            onEdit={onEditClick}
            onDelete={onDelete}
            onMarkPaid={onMarkPaid}
            onDuplicate={onDuplicate}
            deleteLoading={deleteLoading}
          />
        ),
      },
    ],
    [
      payments,
      filters,
      selectedColumns,
      debtorCompanies,
      sepDomainID,
      deleteLoading,
      dateFilters,
      domainsFilter,
      companiesFilter,
      setFilters,
      onViewClick,
      onEditClick,
      onDelete,
      onMarkPaid,
      onDuplicate,
      isGlobalAdmin,
      isDomainAdmin,
      isUser,
      isSingleCompanyByData,
      themeKey,
      token,
    ]
  )
}
