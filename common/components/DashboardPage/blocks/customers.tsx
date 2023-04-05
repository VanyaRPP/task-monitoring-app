import React, { ReactElement, useState } from 'react'
import { Alert, Table } from 'antd'
import TableCard from '@common/components/UI/TableCard'
import {
  useDeleteCustomerMutation,
  useGetAllCustomerQuery,
} from '@common/api/customerApi/customer.api'
import {
  useGetAllUsersQuery,
  useGetUserByEmailQuery,
} from '@common/api/userApi/user.api'
import { AppRoutes, Roles } from '@utils/constants'
import Link from 'next/link'
import { SelectOutlined } from '@ant-design/icons'
import { useRouter } from 'next/router'
import cn from 'classnames'
import { useSession } from 'next-auth/react'
import s from './style.module.scss'
import CustomerCardHeader from '@common/components/UI/CustomerCardHeader'
import { useEffect } from 'react'

const CustomersBlock = () => {
  const router = useRouter()
  const {
    pathname,
    query: { email },
  } = router
  const { data } = useSession()

  const {
    data: allUsers,
    isLoading: allUsersLoading,
    isError: allUsersError,
    isFetching: allUsersFetching,
  } = useGetAllUsersQuery()

  const columns = [
    {
      title: 'Клієнт',
      dataIndex: 'email',
      key: 'email',
      width: '25%',
      ellipsis: true,
    },
    {
      title: 'Розміщення',
      dataIndex: 'locations',
      key: 'locations',
      width: '25%',
      render: (locations) => locations,
    },
    {
      title: 'Інформація',
      dataIndex: 'information',
      key: 'information',
      width: '25%',
      render: (information) => information,
    },
    {
      title: '',
      dataIndex: '',
      key: 'description',
      width: '25%',
      ellipsis: true,
    },
  ]

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
          <Link href={AppRoutes.CUSTOMER}>
            <a className={s.title}>
              Клієнти
              <SelectOutlined />
            </a>
          </Link>
        )
      }
      className={cn({ [s.noScroll]: pathname === AppRoutes.CUSTOMER })}
    >
      {content}
    </TableCard>
  )
}

export default CustomersBlock
