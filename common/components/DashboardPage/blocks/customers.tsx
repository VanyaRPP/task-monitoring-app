import React, { ReactElement, useState } from 'react'
import { Alert, Table } from 'antd'
import TableCard from '@common/components/UI/TableCard'
import {
  useDeleteCustomerMutation,
  useGetAllCustomerQuery,
} from '@common/api/customerApi/customer.api'
// import { IExtendedCustomer } from '@common/api/customerApi/customer.api.types'
import { useGetUserByEmailQuery } from '@common/api/userApi/user.api'
import { AppRoutes, Roles } from '@utils/constants'
import Link from 'next/link'
import { SelectOutlined } from '@ant-design/icons'
import { useRouter } from 'next/router'
import cn from 'classnames'
import { useSession } from 'next-auth/react'
import s from './style.module.scss'
import CustomerCardHeader from '@common/components/UI/CustomerCardHeader'

const CustomersBlock = () => {
  const router = useRouter()
  const {
    pathname,
    query: { email },
  } = router
  const { data } = useSession()

  const {
    data: byEmailUser,
    isLoading: byEmailUserLoading,
    isFetching: byEmailUserFetching,
    isError: byEmailUserError,
  } = useGetUserByEmailQuery(email, { skip: !email })
  const {
    data: currUser,
    isLoading: currUserLoading,
    isFetching: currUserFetching,
    isError: currUserError,
  } = useGetUserByEmailQuery(data?.user.email, { skip: !data?.user.email })

  const isAdmin = currUser?.data?.role === Roles.ADMIN

  const {
    data: customers,
    isLoading: customersLoading,
    isFetching: customersFetching,
    isError: customersError,
  } = useGetAllCustomerQuery({
    limit: pathname === AppRoutes.CUSTOMER ? 200 : 5,
    ...(email || isAdmin
      ? { userId: byEmailUser?.data._id as string }
      : { userId: currUser?.data._id as string }),
  })

  const [deleteCustomer, { isLoading: deleteLoading, isError: deleteError }] =
    useDeleteCustomerMutation()

  const columns = [
    isAdmin && !email
      ? {
          title: 'Клієнт',
          dataIndex: 'customer',
          key: 'customer',
          width: '25%',
          ellipsis: true,
          render: (customer) => (
            <Link
              href={{
                pathname: AppRoutes.CUSTOMER,
                query: { email: customer?.email },
              }}
            >
              <a className={s.customer}>{customer?.email}</a>
            </Link>
          ),
        }
      : { width: '0' },
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

  if (byEmailUserError || deleteError || customersError || currUserError) {
    content = <Alert message="Помилка" type="error" showIcon closable />
  } else {
    content = (
      <Table
        columns={columns}
        dataSource={customers}
        pagination={false}
        bordered
        loading={
          byEmailUserLoading ||
          byEmailUserFetching ||
          currUserLoading ||
          currUserFetching ||
          customersLoading ||
          customersFetching
        }
        rowKey="_id"
      />
    )
  }

  return (
    <TableCard
      title={
        isAdmin ? (
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
