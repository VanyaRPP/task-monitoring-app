import React, { ReactElement } from 'react'
import { Alert, Table } from 'antd'
import TableCard from '@common/components/UI/TableCard'
import { useGetAllUsersQuery } from '@common/api/userApi/user.api'
import { AppRoutes } from '@utils/constants'
import Link from 'next/link'
import { SelectOutlined } from '@ant-design/icons'
import { useRouter } from 'next/router'
import cn from 'classnames'
import { useSession } from 'next-auth/react'
import s from './style.module.scss'
import CustomerCardHeader from '@common/components/UI/CustomerCardHeader'

const RealEstateBlock = () => {
  const router = useRouter()
  const {
    pathname, // query: { email }
  } = router
  const { data } = useSession()

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
      title={
        data ? (
          <CustomerCardHeader />
        ) : (
          <Link href={AppRoutes.REAL_ESTATE}>
            <a className={s.title}>
              Клієнти
              <SelectOutlined />
            </a>
          </Link>
        )
      }
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
    ellipsis: true,
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
