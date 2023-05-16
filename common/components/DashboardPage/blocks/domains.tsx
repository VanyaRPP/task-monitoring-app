import React, { FC } from 'react'
import { Table } from 'antd'
import TableCard from '@common/components/UI/TableCard'
import DomainStreetsComponent from '@common/components/UI/DomainsComponents/DomainStreetsComponent'
import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'
import OrganistaionsComponents from '@common/components/UI/OrganistaionsComponents'

interface Props {
  data: { streetName: string }
}

const DomainsBlock: FC<Props> = ({ data }) => {
  const { data: domains, isLoading } = useGetDomainsQuery({})

  return (
    <TableCard title={<DomainStreetsComponent data={data} />}>
      <Table
        loading={isLoading}
        expandable={{
          expandedRowRender: (data) => (
            <Table
              expandable={{
                expandedRowRender: (data) => <OrganistaionsComponents />,
              }}
              dataSource={testData1}
              columns={columns1}
              pagination={false}
            />
          ),
        }}
        dataSource={domains}
        columns={columns}
        pagination={false}
      />
    </TableCard>
  )
}
const columns1 = [
  {
    title: 'Вулиця',
    dataIndex: 'street',
  },
]

const testData1 = [
  {
    street: '12 Короленка 12',
  },
]
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
