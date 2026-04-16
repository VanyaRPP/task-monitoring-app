import { useGetCustomServicesByDomainQuery } from '@common/api/customServicesApi/customServices.api'
import { usePaymentContext } from '@components/AddPaymentModal'
import { Table } from 'antd'
import { useMemo } from 'react'
import { getCurrencyShortLabel, normalizeCurrency } from '@utils/helpers'
import { ServiceType } from '@utils/constants'

export interface PaymentPricesTableProps {
  preview?: boolean
  usePreviewQuantityToggle?: boolean
  domainId?: string
  currency?: string
  loading?: boolean
  invoices?: any[]
}

interface IPriceTableRow {
  key: number
  name: string
  sum: number | string
  amount?: number
  price?: number
  type?: string
}

const invoiceMatchesGroupService = (invoice: any, service: any): boolean =>
  invoice?.name === service?.name ||
  invoice?.type === service?.fieldName ||
  (invoice?.type === 'maintenancePrice' && service?.fieldName === 'rentPrice')

const groupedInvoices = (invoices: any[] | undefined, groups: any[] | undefined) => {
  if (!groups?.length) return []

  return groups.map((group) => {
    const groupInvoices =
      invoices?.filter(
        (invoice) =>
          invoice?.type !== 'discount' &&
          group?.services?.some((service: any) =>
            invoiceMatchesGroupService(invoice, service)
          )
      ) ?? []

    const totalGroupSum = groupInvoices.reduce(
      (sum, invoice) => sum + Number(invoice?.sum ?? 0),
      0
    )

    return {
      groupName: group?.groupName,
      invoices: groupInvoices,
      totalSum: totalGroupSum.toFixed(2),
      fieldNames: group?.services?.map((s: any) => s?.fieldName).filter(Boolean),
    }
  })
}

const getColumns = (currency?: string, includeQuantityAndPrice = true) => {
  const isUah = normalizeCurrency(currency) === 'UAH'
  const currencyLabel = getCurrencyShortLabel(currency)
  const baseColumns = [
    {
      title: isUah ? '№' : 'No.',
      dataIndex: 'key',
      key: 'key',
      width: 45,
    },
    {
      title: isUah ? 'Найменування послуги' : 'Service name',
      dataIndex: 'name',
      key: 'name',
    },
  ]

  const quantityAndPriceColumns = [
    {
      title: isUah ? 'К-сть' : 'Quantity',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (value: any, record: any = {}) => {
        const n = Number(value)
        const type = record.type
        const displayValue = !isFinite(n) || n === 0 ? 1 : n

        if (type === ServiceType.Placing || type === 'rentPrice') {
          return `${displayValue.toFixed(2)} ${isUah ? 'м²' : 'm²'}`
        }
        if (type === ServiceType.Electricity || type === 'electricityPrice') {
          return `${displayValue.toFixed(2)} ${isUah ? 'кВт' : 'kWh'}`
        }
        if (
          type === ServiceType.Water ||
          type === 'waterPrice' ||
          type === 'waterPriceTotal'
        ) {
          return `${displayValue.toFixed(2)} ${isUah ? 'м³' : 'm³'}`
        }
        return displayValue
      },
    },
    {
      title: `${isUah ? 'Ціна' : 'Price'}, ${currencyLabel}`,
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (value: any, record: any = {}) => {
        const n = Number(value)
        if (!isFinite(n) || n === 0) return '-'
        const formatted = n.toFixed(2)
        const type = record.type

        if (type === ServiceType.Placing || type === 'rentPrice') {
          return `${formatted} ${currencyLabel}/${isUah ? 'м²' : 'm²'}`
        }
        if (type === ServiceType.Electricity || type === 'electricityPrice') {
          return `${formatted} ${currencyLabel}/${isUah ? 'кВт' : 'kWh'}`
        }
        if (
          type === ServiceType.Water ||
          type === 'waterPrice' ||
          type === 'waterPriceTotal'
        ) {
          return `${formatted} ${currencyLabel}/${isUah ? 'м³' : 'm³'}`
        }
        return formatted
      },
    },
  ]

  const sumColumn = {
    title: `${isUah ? 'Сума' : 'Amount'}, ${currencyLabel}`,
    dataIndex: 'sum',
    key: 'sum',
    width: 120,
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

const resolveInvoiceLabel = (inv: any, isEnglish: boolean): string => {
  if (inv?.name) return inv.name

  switch (inv.type) {
    case ServiceType.Maintenance:
      return isEnglish ? 'Maintenance' : 'Утримання'
    case ServiceType.Placing:
    case 'rentPrice':
      return isEnglish ? 'Placing' : 'Розміщення'
    case ServiceType.Inflicion:
      return isEnglish ? 'Inflation' : 'Інфляція'
    case ServiceType.Electricity:
    case 'electricityPrice':
      return isEnglish ? 'Electricity' : 'Електроенергія'
    case ServiceType.Water:
    case 'waterPrice':
    case 'waterPriceTotal':
      return isEnglish ? 'Water supply' : 'Водопостачання'
    case ServiceType.WaterPart:
      return isEnglish ? 'Water supply share' : 'Частка водопостачання'
    case ServiceType.GarbageCollector:
    case 'garbageCollectorPrice':
      return isEnglish ? 'Garbage removal' : 'Вивіз ТПВ'
    case ServiceType.Cleaning:
      return isEnglish ? 'Cleaning' : 'Прибирання'
    case ServiceType.Discount:
    case 'discount':
      return isEnglish ? 'Discount' : 'Знижка'
    case ServiceType.Custom:
      return isEnglish ? 'Custom' : 'Власне'
    default:
      return inv.name || (isEnglish ? 'Additional' : 'Додатково')
  }
}

const GroupedPricesTable: React.FC<PaymentPricesTableProps> = ({
  currency,
  loading,
  invoices,
  preview,
  usePreviewQuantityToggle,
  domainId,
}) => {
  const { form, company, showQuantityInPreview } = usePaymentContext()
  const { domain } = form.getFieldsValue()

  const resolvedDomainId =
    typeof domainId === 'string'
      ? domainId
      : (domainId as { _id?: string } | undefined)?._id

  const { data: customDomainServices } = useGetCustomServicesByDomainQuery(
    { domainId: resolvedDomainId as any },
    { skip: !resolvedDomainId }
  )

  const isEnglish =
    normalizeCurrency(currency || company?.currency || domain?.currency) !== 'UAH'

  const includeQuantityAndPrice =
    !preview || !usePreviewQuantityToggle || showQuantityInPreview

  const useGroupedByDomainLayout =
    preview &&
    usePreviewQuantityToggle &&
    !showQuantityInPreview &&
    !!resolvedDomainId &&
    (customDomainServices?.data?.length ?? 0) > 0

  const dataSource = useMemo(() => {
    const filtered =
      invoices?.filter(
        (inv) => Number(inv?.sum || 0) !== 0 || inv?.type === 'discount'
      ) ?? []

    if (!useGroupedByDomainLayout) {
      const flat: IPriceTableRow[] =
        filtered.map((inv, index) => ({
          key: index + 1,
          name: resolveInvoiceLabel(inv, isEnglish),
          sum: inv.sum,
          amount: inv.amount,
          price: inv.price,
          type: inv.type,
        })) ?? []
      return flat
    }

    const groups = customDomainServices?.data ?? []
    const nonDiscount = filtered.filter((inv) => inv?.type !== 'discount')
    const groupedInvoicesData = groupedInvoices(nonDiscount, groups)

    const matched = new Set(
      groupedInvoicesData.flatMap((g) => g.invoices)
    )

    const rows: IPriceTableRow[] =
      groupedInvoicesData?.map((group, index) => ({
        key: index + 1,
        name: group.groupName,
        sum: group.totalSum,
      })) ?? []

    const discountInvoice = filtered.find((inv) => inv?.type === 'discount')
    if (discountInvoice) {
      rows.push({
        key: rows.length + 1,
        name: isEnglish ? 'Discount' : 'Знижка',
        sum: discountInvoice.sum,
      })
    }

    nonDiscount.forEach((inv) => {
      if (matched.has(inv)) return

      rows.push({
        key: rows.length + 1,
        name: resolveInvoiceLabel(inv, isEnglish),
        sum: inv.sum,
      })
    })

    return rows
  }, [
    invoices,
    isEnglish,
    useGroupedByDomainLayout,
    customDomainServices?.data,
  ])

  return (
    <Table<IPriceTableRow>
      dataSource={dataSource}
      columns={getColumns(
        currency || company?.currency || domain?.currency,
        includeQuantityAndPrice
      )}
      loading={loading}
      pagination={false}
      bordered
    />
  )
}

export default GroupedPricesTable
