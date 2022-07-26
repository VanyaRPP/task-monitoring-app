import React, { useState } from 'react'
import { Card, Table, Input } from 'antd'
import { useGetAllTaskQuery } from '../../../api/taskApi/task.api'
import { firstTextToUpperCase } from '../../../../utils/helpers'
import { useGetUserByIdQuery } from '../../../api/userApi/user.api'
import UserLink from '../../UserLink'
import moment from 'moment'
import { useRouter } from 'next/router'
import { AppRoutes } from '../../../../utils/constants'

import s from '../style.module.scss'

interface Props {
  style?: string
}

const Master: React.FC<{ id: string }> = ({ id }) => {
  const { data } = useGetUserByIdQuery(id)
  const user = data?.data
  return <UserLink user={user} />
}

const Orders: React.FC<Props> = ({ style }) => {
  const [search, setSearch] = useState({ task: '', master: '' })
  const router = useRouter()
  const { data } = useGetAllTaskQuery('')
  const tasks = data?.data

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
      render: (text) => (text ? <Master id={text} /> : 'Не назначено'),
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
        dataSource={tasks}
        columns={columns}
        pagination={{ responsive: true, size: 'small', pageSize: 6 }}
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
