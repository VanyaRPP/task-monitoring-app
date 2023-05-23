import React from 'react'
import { Table } from 'antd'
import cn from 'classnames'
import { useRouter } from 'next/router'
import { AppRoutes } from '@utils/constants'
import s from './style.module.scss'
import TableCard from '@common/components/UI/TableCard'
import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'
import DomainStreetsComponent from '@common/components/UI/DomainsComponents/DomainStreetsComponent'
import RealEstateBlock from './realEstates'

const DomainsBlock = () => {
  const { data: domains, isLoading } = useGetDomainsQuery({})
  const router = useRouter()
  const {
    pathname,
    query: { email },
  } = router

  const domainsPageColumns =
    router.pathname === AppRoutes.DOMAIN
      ? [
          {
            title: 'Телефон',
            dataIndex: 'phone',
          },
          {
            title: 'Пошта',
            dataIndex: 'email',
          },
        ]
      : []

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
    ...domainsPageColumns,
  ]

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
                expandedRowRender: (street) => (
                  <RealEstateBlock domainId={data._id} streetId={street._id} />
                ),
              }}
              dataSource={data.streets}
              columns={columns1}
              pagination={false}
              rowKey="_id"
            />
          ),
        }}
        dataSource={domains}
        columns={columns}
        pagination={false}
        rowKey="_id"
      />
    </TableCard>
  )
}
const columns1 = [
  {
    title: 'Вулиця',
    dataIndex: 'address',
  },
]

export default DomainsBlock
