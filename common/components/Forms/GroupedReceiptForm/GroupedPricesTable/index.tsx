import { useGetCustomServicesByDomainQuery } from '@common/api/customServicesApi/customServices.api'
import { usePaymentContext } from '@components/AddPaymentModal'
import { Table } from 'antd'
import type { TFunction } from 'i18next'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { getInvoiceServiceLabelKey } from '@utils/invoice-service-label-key'
import { getCurrencyShortLabel, normalizeCurrency } from '@utils/helpers'
import { ServiceType } from '@utils/constants'
import s from './index.module.scss'

export interface PaymentPricesTableProps {
  preview?: boolean
  usePreviewQuantityToggle?: boolean
  domainId?: string
  currency?: string
  loading?: boolean
  invoices?: any[]
  invoiceLang?: 'en' | 'uk'
  showQuantityInPreview?: boolean
}

interface IPriceTableRow {
  key: number
  name: string
  sum: number | string
  amount?: number
  price?: number
  type?: string
}

export function shouldShowInvoiceQuantityAndPriceColumns(
  preview?: boolean,
  usePreviewQuantityToggle?: boolean,
  showQuantityInPreview?: boolean
): boolean {
  return !preview || !usePreviewQuantityToggle || !!showQuantityInPreview
}

export function shouldUseGroupedByDomainPreviewLayout(
  preview?: boolean,
  usePreviewQuantityToggle?: boolean,
  showQuantityInPreview?: boolean,
  resolvedDomainId?: string,
  groupsLength?: number
): boolean {
  return (
    !!preview &&
    !!usePreviewQuantityToggle &&
    !showQuantityInPreview &&
    !!resolvedDomainId &&
    (groupsLength ?? 0) > 0
  )
}

function getInvoiceTableLng(currency?: string): 'en' | 'uk' {
  return normalizeCurrency(currency) === 'UAH' ? 'uk' : 'en'
}

const invoiceMatchesGroupService = (invoice: any, service: any): boolean => {
  if (!invoice || !service) return false
  if (invoice.name && invoice.name === service.name) return true
  if (invoice.fieldName && invoice.fieldName === service.fieldName) return true
  if (invoice.type && invoice.type === service.fieldName) return true
  const invoiceId = invoice.serviceId
  if (invoiceId && String(invoiceId) === String(service._id)) return true
  if (invoice.type === 'maintenancePrice' && service.fieldName === 'rentPrice')
    return true
  return false
}

const assignInvoicesToGroupsFirstWin = (
  invoices: any[] | undefined,
  groups: any[] | undefined
): {
  groupRows: Array<{ groupName: string; totalSum: string }>
  unmatchedInvoices: any[]
} => {
  if (!groups?.length || !invoices?.length) {
    return { groupRows: [], unmatchedInvoices: invoices ?? [] }
  }

  // Whether a service is technically standard (Maintenance/Electricity/etc) or
  // truly custom doesn't matter for grouping: if it's listed on the RIGHT of a
  // user-defined group's Transfer, it gets rolled up under that group header.
  // What renders standalone is everything that falls through to `remaining` —
  // services that aren't in any user-defined group (the synthetic null bucket
  // is skipped below) or that don't exist in the domain catalog at all.
  const remaining = new Set(invoices.filter((inv) => inv?.type !== 'discount'))
  const groupRows: Array<{ groupName: string; totalSum: string }> = []

  for (const group of groups) {
    // Skip the synthetic "ungrouped" bucket (groupName: null) coming from the
    // domain endpoint — services there render as individual line items, never
    // collapsed under a header.
    if (!group?.groupName) continue
    const groupInvoices: any[] = []
    for (const inv of [...remaining]) {
      if (
        group?.services?.some((service: any) =>
          invoiceMatchesGroupService(inv, service)
        )
      ) {
        groupInvoices.push(inv)
        remaining.delete(inv)
      }
    }

    const totalGroupSum = groupInvoices.reduce(
      (sum, invoice) => sum + Number(invoice?.sum ?? 0),
      0
    )

    if (groupInvoices.length === 0) {
      continue
    }

    if (totalGroupSum === 0) {
      groupInvoices.forEach((inv) => remaining.add(inv))
      continue
    }

    groupRows.push({
      groupName: group?.groupName ?? '',
      totalSum: totalGroupSum.toFixed(2),
    })
  }

  return { groupRows, unmatchedInvoices: [...remaining] }
}

function resolveInvoiceLabel(inv: any, t: TFunction<'groupedReceipt'>): string {
  if (inv?.description) return inv.description
  return inv?.name ?? t(`services.${getInvoiceServiceLabelKey(inv.type)}`)
}

const getColumns = (
  currency: string | undefined,
  includeQuantityAndPrice: boolean,
  t: TFunction<'groupedReceipt'>
) => {
  const currencyLabel = getCurrencyShortLabel(currency)
  const baseColumns = [
    {
      title: t('columns.rowNumber'),
      dataIndex: 'key',
      key: 'key',
      width: 45,
    },
    {
      title: t('columns.serviceName'),
      dataIndex: 'name',
      key: 'name',
    },
  ]

  const quantityAndPriceColumns = [
    {
      title: t('columns.quantity'),
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      className: s.priceCell,
      render: (value: any, record: any = {}) => {
        const n = Number(value)
        const type = record.type
        const displayValue = !isFinite(n) || n === 0 ? 1 : n

        if (type === ServiceType.Placing || type === 'rentPrice') {
          return `${displayValue.toFixed(2)} ${t('units.m2')}`
        }
        if (type === ServiceType.Electricity || type === 'electricityPrice') {
          return `${displayValue.toFixed(2)} ${t('units.kWh')}`
        }
        if (
          type === ServiceType.Water ||
          type === 'waterPrice' ||
          type === 'waterPriceTotal'
        ) {
          return `${displayValue.toFixed(2)} ${t('units.m3')}`
        }
        return displayValue
      },
    },
    {
      title: t('columns.price', { currency: currencyLabel }),
      dataIndex: 'price',
      key: 'price',
      width: 120,
      className: s.priceCell,
      render: (value: any, record: any = {}) => {
        const n = Number(value)
        if (!isFinite(n) || n === 0) return '-'
        const formatted = n.toFixed(2)
        const type = record.type

        if (type === ServiceType.Placing || type === 'rentPrice') {
          return `${formatted} ${currencyLabel}/${t('units.m2')}`
        }
        if (type === ServiceType.Electricity || type === 'electricityPrice') {
          return `${formatted} ${currencyLabel}/${t('units.kWh')}`
        }
        if (
          type === ServiceType.Water ||
          type === 'waterPrice' ||
          type === 'waterPriceTotal'
        ) {
          return `${formatted} ${currencyLabel}/${t('units.m3')}`
        }
        return formatted
      },
    },
  ]

  const sumColumn = {
    title: t('columns.amount', { currency: currencyLabel }),
    dataIndex: 'sum',
    key: 'sum',
    width: 120,
    className: s.priceCell,
    render: (value: any) => {
      const n = Number(value)
      return isFinite(n) ? n.toFixed(2) : value
    },
  }

  if (!includeQuantityAndPrice) {
    return [...baseColumns, sumColumn]
  }

  return [...baseColumns, ...quantityAndPriceColumns, sumColumn]
}

const GroupedPricesTable: React.FC<PaymentPricesTableProps> = ({
  currency,
  loading,
  invoices,
  preview,
  usePreviewQuantityToggle,
  domainId,
  invoiceLang,
  showQuantityInPreview: showQuantityInPreviewProp,
}) => {
  const { form, company, showQuantityInPreview: showQuantityInPreviewCtx } = usePaymentContext()
  const { domain } = form?.getFieldsValue?.() ?? {}
  const showQuantityInPreview = showQuantityInPreviewProp ?? showQuantityInPreviewCtx
  const { i18n } = useTranslation('groupedReceipt')

  const resolvedDomainId =
    typeof domainId === 'string'
      ? domainId
      : (domainId as { _id?: string } | undefined)?._id

  const { data: customDomainServices } = useGetCustomServicesByDomainQuery(
    { domainId: resolvedDomainId as any },
    { skip: !resolvedDomainId || !usePreviewQuantityToggle }
  )

  const resolvedCurrency = currency || company?.currency || domain?.currency
  const invoiceLng = invoiceLang ?? getInvoiceTableLng(resolvedCurrency)

  const tInvoice = useMemo(
    () => i18n.getFixedT(invoiceLng, 'groupedReceipt'),
    [i18n, invoiceLng]
  )

  const includeQuantityAndPrice = shouldShowInvoiceQuantityAndPriceColumns(
    preview,
    usePreviewQuantityToggle,
    showQuantityInPreview
  )

  const useGroupedByDomainLayout = shouldUseGroupedByDomainPreviewLayout(
    preview,
    usePreviewQuantityToggle,
    showQuantityInPreview,
    resolvedDomainId,
    customDomainServices?.data?.length ?? 0
  )

  const dataSource = useMemo(() => {
    const filtered =
      invoices?.filter(
        (inv) => Number(inv?.sum || 0) !== 0 || inv?.type === 'discount'
      ) ?? []

    if (!useGroupedByDomainLayout) {
      return (
        filtered.map((inv, index) => ({
          key: index + 1,
          name: resolveInvoiceLabel(inv, tInvoice),
          sum: inv.sum,
          amount: inv.amount,
          price: inv.price,
          type: inv.type,
        })) ?? []
      )
    }

    const groups = customDomainServices?.data ?? []
    const nonDiscount = filtered.filter((inv) => inv?.type !== 'discount')
    const { groupRows, unmatchedInvoices } = assignInvoicesToGroupsFirstWin(
      nonDiscount,
      groups
    )

    const rows: IPriceTableRow[] = groupRows.map((group, index) => ({
      key: index + 1,
      name: group.groupName,
      sum: group.totalSum,
    }))

    const discountInvoice = filtered.find((inv) => inv?.type === 'discount')
    if (discountInvoice) {
      rows.push({
        key: rows.length + 1,
        name: resolveInvoiceLabel(discountInvoice, tInvoice),
        sum: discountInvoice.sum,
      })
    }

    unmatchedInvoices.forEach((inv) => {
      rows.push({
        key: rows.length + 1,
        name: resolveInvoiceLabel(inv, tInvoice),
        sum: inv.sum,
      })
    })

    return rows
  }, [invoices, tInvoice, useGroupedByDomainLayout, customDomainServices?.data])

  return (
    <Table<IPriceTableRow>
      dataSource={dataSource}
      columns={getColumns(resolvedCurrency, includeQuantityAndPrice, tInvoice)}
      loading={loading}
      pagination={false}
      bordered
    />
  )
}

export default GroupedPricesTable
