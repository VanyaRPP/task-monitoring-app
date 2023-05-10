import React from 'react'
import { Table } from 'antd'
import TableCard from '@common/components/UI/TableCard'
import DomainStreetsComponent from '@common/components/UI/DomainsComponents/DomainStreetsComponent'
import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'

const DomainsBlock = () => {
  const { data: domains, isLoading } = useGetDomainsQuery({})

  return (
    <TableCard title="Домени">
      <Table
        loading={isLoading}
        expandable={{
          expandedRowRender: (data) => <DomainStreetsComponent data={data} />,
        }}
        dataSource={domains}
        columns={columns}
        pagination={false}
      />
    </TableCard>
  )
}

const columns = [
  {
    title: 'Назва',
    dataIndex: 'name',
  },
  {
    title: 'Адреса',
    dataIndex: 'address',
  },
  {
    title: 'Адміністратори',
    dataIndex: 'adminEmails',
  },
  {
    title: 'Опис',
    dataIndex: 'description',
  },
  {
    title: 'Отримувач',
    dataIndex: 'bankInformation',
  },
  {
    title: 'Телефон',
    dataIndex: 'phone',
  },
  {
    title: 'Пошта',
    dataIndex: 'email',
  },
]

export default DomainsBlock
