import React from 'react'
import { Button, Table } from 'antd'
import { PlusOutlined, SelectOutlined } from '@ant-design/icons'
import TableCard from '@common/components/UI/TableCard'
import { AppRoutes } from '@utils/constants'
import { useRouter } from 'next/router'
import Link from 'next/link'
import DomainStreetsComponent from '@common/components/UI/DomainsComponents/DomainStreetsComponent'
import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'
import cn from 'classnames'
import s from './style.module.scss'

const DomainsBlock = () => {
  const { data: domains, isLoading } = useGetDomainsQuery({})
  const router = useRouter()
  const {
    pathname,
    query: { email },
  } = router

  return (
    <TableCard
      title={
        <Button type="link" onClick={() => router.push(AppRoutes.DOMAIN)}>
          Домени
          <SelectOutlined className={s.Icon} />
        </Button>
      }
      className={cn({ [s.noScroll]: pathname === AppRoutes.DOMAIN })}
    >
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
