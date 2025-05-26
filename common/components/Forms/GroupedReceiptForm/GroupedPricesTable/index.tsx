import { usePaymentContext } from '@components/AddPaymentModal'
import { useGetCustomServicesByDomainQuery } from '@common/api/customServicesApi/customServices.api'
import { Table } from 'antd'
import { useEffect, useMemo, useState } from 'react'

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
    }
  })
}

const GroupedPricesTable: React.FC<PaymentPricesTableProps> = ({
  preview,
  domainId,
  loading,
  invoices
}) => {
  const { form, company } = usePaymentContext()
  const { data: customDomainServices } = useGetCustomServicesByDomainQuery(
    { domainId: [domainId] },
    { skip: !domainId }
  )
  console.log('customDomainServices', customDomainServices?.data)
  console.log('payment', invoices)
  const groupedInvoicesData = useMemo(
    () => groupedInvoices(invoices, customDomainServices?.data),
    [invoices, customDomainServices]
  )

  const dataSource = groupedInvoicesData?.map((group, index) => {
    return {
      key: index + 1,
      name: group.groupName,
      sum: group.totalSum,
    }
  })

  if (invoices?.find((invoice) => invoice?.type === 'discount')) {
    dataSource?.push({
      key: dataSource?.length,
      name: 'Знижка',
      sum: invoices?.find((invoice) => invoice?.type === 'discount')?.sum,
    })
  }

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