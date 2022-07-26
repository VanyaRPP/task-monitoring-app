import React, { useMemo, useState } from 'react'
import { Card, Table, Input } from 'antd'
import { useGetAllTaskQuery } from '../../../api/taskApi/task.api'
import { firstTextToUpperCase } from '../../../../utils/helpers'
import {
  useGetUserByEmailQuery,
  useGetUserByIdQuery,
} from '../../../api/userApi/user.api'
import moment from 'moment'
import { useRouter } from 'next/router'
import { AppRoutes } from '../../../../utils/constants'

import s from '../style.module.scss'
import { useSession } from 'next-auth/react'

const Orders: React.FC<{ style: string }> = ({ style }) => {
  const session = useSession()
  const [search, setSearch] = useState({ task: '', master: '' })
  const router = useRouter()
  const userResponse = useGetUserByEmailQuery(session?.data?.user?.email)
  const tasksResponse = useGetAllTaskQuery('')
  const user = userResponse?.data?.data
  const tasks = tasksResponse?.data?.data

  const dataSource = useMemo(() => {
    return tasks?.filter((task) => task?.creator === user?._id)
  }, [tasks, user?._id])

  const searchInput = (order: string) => (
    <Input
      placeholder={order.charAt(0).toUpperCase() + order.slice(1)}
      value={search[order]}
      onChange={(e) => setSearch({ ...search, [order]: e.target.value })}
    />
  )

  const columns = [
    {
      title: searchInput('Завдання'),
      dataIndex: 'name',
      key: 'name',
      width: '35%',
    },
    {
      title: searchInput('Майстер'),
      dataIndex: 'executant',
      key: 'executant',
      width: '25%',
      render: (text) => (text ? text : 'Не назначено'),
    },
    {
      title: 'Дата',
      dataIndex: 'deadline',
      key: 'deadline',
      width: '20%',
      sorter: (a, b) => Date.parse(a.date) - Date.parse(b.date),
      render: (text) => moment(text).format('DD-MM hh:mm'),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: '20%',
      render: (text) => firstTextToUpperCase(text),
    },
  ]

  return (
    <Card className={style} title="Мої замовлення" style={{ flex: '1.5' }}>
      <Table
        rowKey="_id"
        rowClassName={s.rowClass}
        showHeader={false}
        dataSource={dataSource}
        columns={columns}
        pagination={{
          responsive: false,
          size: 'small',
          pageSize: 6,
          position: ['bottomCenter'],
          hideOnSinglePage: true,
        }}
        onRow={(record, rowIndex) => {
          return {
            onClick: (event) => router.push(`${AppRoutes.TASK}/${record._id}`),
          }
        }}
      />
    </Card>
  )
}

export default Orders
