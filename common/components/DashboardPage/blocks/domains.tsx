import React, { FC } from 'react'
import { Table } from 'antd'
import cn from 'classnames'
import { useRouter } from 'next/router'
import { AppRoutes } from '@utils/constants'
import s from './style.module.scss'
import TableCard from '@common/components/UI/TableCard'
import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'
import OrganistaionsComponents from '@common/components/UI/OrganistaionsComponents'
import DomainStreetsComponent from '@common/components/UI/DomainsComponents/DomainStreetsComponent'

const DomainsBlock = () => {
  const { data: domains, isLoading } = useGetDomainsQuery({})
  const router = useRouter()
  const {
    pathname,
    query: { email },
  } = router
  return (
    <TableCard
      title={<DomainStreetsComponent data={domains} />}
      className={cn({ [s.noScroll]: pathname === AppRoutes.DOMAIN })}
    >
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
