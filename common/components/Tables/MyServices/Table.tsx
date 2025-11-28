import React from 'react'
import { Table, Alert } from 'antd'
import { ColumnType } from 'antd/lib/table'
import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'
import { IExtendedDomain } from '@common/api/domainApi/domain.api.types'
import { useGetCustomServicesByDomainQuery,} from '@common/api/customServicesApi/customServices.api'
import { ICustomDomainService } from '@common/api/customServicesApi/customServices.api.types'

interface MyServicesTableProps {
  domainId?: string
}

const MyServicesTable: React.FC<MyServicesTableProps> = ({ domainId }) => {
  const { data: domainsData, isLoading, isError } = useGetDomainsQuery({})

  if (isError) return <Alert message="Помилка" type="error" showIcon closable />

  const filteredDomains = domainId 
    ? domainsData?.filter(domain => domain._id === domainId)
    : domainsData

  return (
    <Table
      rowKey="_id"
      loading={isLoading}
      dataSource={filteredDomains}
      columns={getDomainsColumns()}
      expandable={{
        expandedRowRender: (domain: IExtendedDomain) => (
          <GroupsTable domainId={domain._id} />
        )
      }}
      pagination={false}
    />
  )
}

const GroupsTable: React.FC<{ domainId: string }> = ({ domainId }) => {
  const { data, isLoading } = useGetCustomServicesByDomainQuery({
    domainId: [domainId]
  })

  const groups: ICustomDomainService[] = data?.data || []

  return (
    <Table
      rowKey="groupName"
      loading={isLoading}
      dataSource={groups}
      columns={getGroupColumns()}
      pagination={false}
      style={{ marginLeft: 40 }}
      expandable={{
        expandedRowRender: (group: ICustomDomainService) => (
          <ServicesTable services={group.services} />
        ),
      }}
    />
  )
}

const ServicesTable: React.FC<{ services: any }> = ({ services }) => {
  const servicesArray = Array.isArray(services) ? services : [services].filter(Boolean)

  return (
    <Table
      rowKey="_id"
      dataSource={servicesArray}
      columns={getServicesColumns()}
      pagination={false}
      style={{ marginLeft: 80 }}
    />
  )
}

const getDomainsColumns = (): ColumnType<IExtendedDomain>[] => [
  {
    title: 'Домен',
    dataIndex: 'name',
    width: '100%',
  },
]

const getGroupColumns = (): ColumnType<ICustomDomainService>[] => [
  {
    title: 'Група послуг',
    dataIndex: 'groupName',
    width: '100%',
  },
]

const getServicesColumns = (): ColumnType<any>[] => [
  {
    title: 'Послуга',
    dataIndex: 'name',
    width: '70%', 
  },
  {
    title: 'Ціна',
    dataIndex: 'price',
    width: '30%',
    render: (price: any) => price || 0,
  },
]

export default MyServicesTable