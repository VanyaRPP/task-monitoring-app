import RealEstateCardHeader from '@common/components/UI/RealEstateComponents/RealEstateCardHeader'
import { useGetAllUsersQuery } from '@common/api/userApi/user.api'
import TableCard from '@common/components/UI/TableCard'
import { AppRoutes } from '@utils/constants'
import React, { ReactElement } from 'react'
import { useRouter } from 'next/router'
import { Alert, Table } from 'antd'
import cn from 'classnames'
import s from './style.module.scss'

const RealEstateBlock = () => {
  const router = useRouter()
  const {
    pathname, // query: { email }
  } = router

  const {
    data: allUsers,
    isLoading: allUsersLoading,
    isError: allUsersError,
    isFetching: allUsersFetching,
  } = useGetAllUsersQuery()

  let content: ReactElement

  if (allUsersError) {
    content = <Alert message="Помилка" type="error" showIcon closable />
  } else {
    content = (
      <Table
        columns={columns}
        dataSource={
          pathname === '/' && allUsers ? allUsers?.slice(0, 5) : allUsers
        }
        pagination={false}
        bordered
        size="small"
        loading={allUsersLoading || allUsersFetching}
        rowKey="_id"
      />
    )
  }

  return (
    <TableCard
      title={<RealEstateCardHeader />}
      className={cn({ [s.noScroll]: pathname === AppRoutes.REAL_ESTATE })}
    >
      {content}
    </TableCard>
  )
}

const columns = [
  {
    title: 'Адреса',
    dataIndex: 'address',
  },
  {
    title: 'Назва компанії',
    dataIndex: 'description',
  },
  {
    title: 'Адміністратори',
    dataIndex: 'adminEmails',
  },
  {
    title: 'Кількість метрів',
    dataIndex: 'totalArea',
  },
  {
    title: 'Ціна за метр',
    dataIndex: 'pricePerMeter',
  },
  {
    title: 'Індивідуальне утримання за метр',
    dataIndex: 'servicePricePerMeter',
  },
  {
    title: 'Вивіз сміття',
    dataIndex: 'garbageCollector',
  },
  {
    title: 'Платник',
    dataIndex: 'payer',
  },
]

export default RealEstateBlock
