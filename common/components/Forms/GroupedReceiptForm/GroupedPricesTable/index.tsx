import { usePaymentContext } from '@components/AddPaymentModal'
import { useGetCustomServicesByDomainQuery } from '@common/api/customServicesApi/customServices.api'
import { Table } from 'antd'
import { useMemo } from 'react'
import { getCurrencyShortLabel, normalizeCurrency } from '@utils/helpers'

export interface PaymentPricesTableProps {
  preview?: boolean
  domainId?: string
  currency?: string
  loading?: boolean
  invoices?: any[]
}

const getColumns = (currency?: string) => [
  {
    title: normalizeCurrency(currency) === 'UAH' ? '№' : 'No.',
    dataIndex: 'key',
    key: 'key',
    width: 45,
  },
  {
    title:
      normalizeCurrency(currency) === 'UAH'
        ? 'Найменування послуги'
        : 'Service name',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: `${normalizeCurrency(currency) === 'UAH' ? 'Сума' : 'Amount'}, ${getCurrencyShortLabel(currency)}`,
    dataIndex: 'sum',
    key: 'sum',
    render: (value: any) => {
      const n = Number(value)
      return isFinite(n) ? n.toFixed(2) : value
    },
  },
]

const groupedInvoices = (invoices: any, groups: any) => {
  // TODO: FIX maintenancePrice && rentPrice logic
  const result =
    groups?.map((group) => {
      const groupInvoices = invoices?.filter((invoice) =>
        group?.services?.some(
          (service) =>
            invoice?.name === service?.name ||
            invoice?.type === service?.fieldName ||
            (invoice?.type === 'maintenancePrice' &&
              service?.fieldName === 'rentPrice')
        )
      )

      const totalGroupSum = (groupInvoices ?? []).reduce((sum, invoice) => {
        return sum + (Number(invoice?.sum) || 0)
      }, 0)

      return {
        groupName: group?.groupName,
        invoices: groupInvoices,
        totalSum: totalGroupSum,
        fieldNames: group?.services?.map((s) => s?.fieldName),
      }
    }) || []

  return result
}

const GroupedPricesTable: React.FC<PaymentPricesTableProps> = ({
  preview,
  domainId,
  currency,
  loading,
  invoices,
}) => {
  const { form, company } = usePaymentContext()

  const { data: customDomainServices } = useGetCustomServicesByDomainQuery(
    { domainId: [domainId] },
    { skip: !domainId }
  )
  const groupedInvoicesData = useMemo(
    () => groupedInvoices(invoices, customDomainServices?.data),
    [invoices, customDomainServices]
  )

  const { domain } = form.getFieldsValue()

  const groupedFieldNames =
    groupedInvoicesData?.flatMap((group) => group.fieldNames || []) || []

  const dataSource =
    groupedInvoicesData
      ?.filter((group) => Number(group?.totalSum || 0).toFixed(2) !== '0.00')
      .map((group, index) => ({
        key: index + 1,
        name: group.groupName,
        sum: group.totalSum,
      })) || []
  const discountInvoice = invoices?.find((inv) => inv?.type === 'discount')
  const isEnglish = normalizeCurrency(currency || company?.currency || domain?.currency) !== 'UAH'

  if (discountInvoice) {
    dataSource.push({
      key: dataSource.length + 1,
      name: isEnglish ? 'Discount' : 'Знижка',
      sum: discountInvoice.sum,
    })
  }

  const customInvoices = invoices?.filter(
    (inv) => inv?.type === 'custom' && !groupedFieldNames.includes(inv?.type)
  )

  customInvoices?.forEach((inv) => {
    // Uncomment to add custom invoices
    !inv?.customService &&
      dataSource.push({
        key: dataSource.length + 1,
        name: inv.name || (isEnglish ? 'Additional' : 'Додатково'),
        sum: inv.sum,
      })
  })

  return (
    <Table
      dataSource={dataSource}
      columns={getColumns(currency || company?.currency || domain?.currency)}
      loading={loading}
      pagination={false}
      bordered
    />
  )
}

export default GroupedPricesTable
