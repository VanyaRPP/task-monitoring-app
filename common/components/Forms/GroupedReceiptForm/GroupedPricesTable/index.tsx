import { usePaymentContext } from '@components/AddPaymentModal'
import { useGetCustomServicesByDomainQuery } from '@common/api/customServicesApi/customServices.api'
import { Table } from 'antd'
import { useMemo } from 'react'

export interface PaymentPricesTableProps {
  preview?: boolean
  domainId?: string
  loading?: boolean
  invoices?: any[]
}

const columns = [
  {
    title: '№',
    dataIndex: 'key',
    key: 'key',
    width: 45,
  },
  {
    title: 'Найменування послуги',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: 'Сума, грн',
    dataIndex: 'sum',
    key: 'sum',
  },
]

const groupedInvoices = (invoices: any, groups: any) => {
  return groups?.map((group) => {
    const groupFieldNames = group?.services.map((service) => service?.fieldName)
    const groupInvoices = invoices?.filter((invoice) =>
      groupFieldNames.includes(invoice?.type)
    )
    const totalGroupSum = (groupInvoices ?? []).reduce((sum, invoice) => {
      return sum + (invoice?.sum ?? 0)
    }, 0)
    return {
      groupName: group?.groupName,
      invoices: groupInvoices,
      totalSum: totalGroupSum.toFixed(2),
      fieldNames: groupFieldNames,
    }
  })
}

const GroupedPricesTable: React.FC<PaymentPricesTableProps> = ({
  preview,
  domainId,
  loading,
  invoices,
}) => {
  const { form } = usePaymentContext()

  const { data: customDomainServices } = useGetCustomServicesByDomainQuery(
    { domainId: [domainId] },
    { skip: !domainId }
  )

  const groupedInvoicesData = useMemo(
    () => groupedInvoices(invoices, customDomainServices?.data),
    [invoices, customDomainServices]
  )

  const groupedFieldNames = groupedInvoicesData
    ?.flatMap((group) => group.fieldNames || []) || []

  const dataSource = groupedInvoicesData?.map((group, index) => ({
    key: index + 1,
    name: group.groupName,
    sum: group.totalSum,
  })) || []


  const discountInvoice = invoices?.find((inv) => inv?.type === 'discount')
  if (discountInvoice) {
    dataSource.push({
      key: dataSource.length + 1,
      name: 'Знижка',
      sum: discountInvoice.sum,
    })
  }


  const customInvoices = invoices?.filter(
    (inv) =>
      inv?.type === 'custom' &&
      !groupedFieldNames.includes(inv?.type)
  )

  customInvoices?.forEach((inv) => {
    dataSource.push({
      key: dataSource.length + 1,
      name: inv.name || 'Додатково',
      sum: inv.sum,
    })
  })

  return (
    <Table
      dataSource={dataSource}
      columns={columns}
      loading={loading}
      pagination={false}
      bordered
    />
  )
}

export default GroupedPricesTable