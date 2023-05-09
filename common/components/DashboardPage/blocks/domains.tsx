import React from 'react'
import { Table } from 'antd'
import TableCard from '@common/components/UI/TableCard'
import DomainStreetsComponent from '@common/components/UI/DomainsComponents/DomainStreetsComponent'

const DomainsBlock = () => {
  return (
    <TableCard title="Домени">
      <Table
        expandable={{
          expandedRowRender: (data) => <DomainStreetsComponent data={data} />,
        }}
        dataSource={testData}
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

const testData = [
  {
    name: 'КП з експлуатації',
    address: 'Короленка 12',
    adminEmails: ['my@gmail.com'],
    streets: ['123', '32434'],
    description: 'sdadsadasd',
    bankInformation: 'тов КП',
    phone: '252467',
    email: 'kpeab@gmail.com',
  },
]

export default DomainsBlock
