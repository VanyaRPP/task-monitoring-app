import React, { FC, useMemo, useState } from 'react'
import { Table, Input, ConfigProvider } from 'antd'
import { useGetAllTaskQuery } from '../../../api/taskApi/task.api'
import { useGetUserByEmailQuery } from '../../../api/userApi/user.api'
import moment from 'moment'
import { useRouter } from 'next/router'
import { AppRoutes, TaskStatuses } from '../../../../utils/constants'
import { useSession } from 'next-auth/react'
import MicroInfoProfile from '../../MicroInfoProfile'
import StatusTag from '../../UI/StatusTag'
import TableCard from '@common/components/UI/TableCard'
import OrdersTableHeader from '@common/components/UI/OrdersTableHeader'
import s from './style.module.scss'

const Orders: FC = () => {
  const session = useSession()
  const [search, setSearch] = useState({ task: '', master: '' })
  const router = useRouter()
  const userResponse = useGetUserByEmailQuery(session?.data?.user?.email, {
    skip: !session?.data?.user?.email,
  })
  const tasksResponse = useGetAllTaskQuery('')
  const user = userResponse?.data?.data
  const tasks = tasksResponse?.data?.data

  const dataSource = useMemo(() => {
    return tasks?.filter((task) => task?.creator === user?._id)
  }, [tasks, user?._id])

  const filteredDataSource = useMemo(() => {
    return dataSource?.filter(
      (data) =>
        data?.status !== TaskStatuses.ARCHIVED &&
        data?.status !== TaskStatuses.COMPLETED &&
        data?.status !== TaskStatuses.EXPIRED
    )
  }, [dataSource])

  const searchInput = (order: string) => (
    <Input
      placeholder={order.charAt(0).toUpperCase() + order.slice(1)}
      value={search[order]}
      onChange={(e) => setSearch({ ...search, [order]: e.target.value })}
    />
  )
  const columns = [
    {
      title: 'Замовлення',
      dataIndex: 'name',
      key: 'name',
      width: '35%',
      ellipsis: true,
    },
    {
      title: 'Майстер',
      dataIndex: 'executant',
      key: 'executant',
      width: '25%',
      ellipsis: true,
      render: (text) =>
        text ? <MicroInfoProfile id={text} /> : 'Не назначено',
    },
    {
      title: 'Дата',
      dataIndex: 'deadline',
      key: 'deadline',
      width: '20%',
      ellipsis: true,
      sorter: (a, b) => Date.parse(a?.deadline) - Date.parse(b?.deadline),
      render: (text) => moment(text).format('DD-MM hh:mm'),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: '20%',
      render: (status) => <StatusTag status={status} />,
    },
  ]

  return (
    <TableCard title={<OrdersTableHeader user={user} />}>
      <Table
        className={s.Table}
        rowKey="_id"
        rowClassName={s.rowClass}
        showHeader={true}
        dataSource={filteredDataSource}
        columns={columns}
        size="small"
        pagination={{
          responsive: false,
          size: 'small',
          pageSize: 5,
          position: ['bottomCenter'],
          hideOnSinglePage: true,
        }}
        onRow={(record, rowIndex) => {
          return {
            onClick: (event) => router.push(`${AppRoutes.TASK}/${record._id}`),
          }
        }}
      />
    </TableCard>
  )
}

export default Orders
