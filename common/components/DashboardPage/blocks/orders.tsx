import React, { useState } from 'react'
import { Card, Table, Input } from 'antd'
import { dateToDefaultFormat } from '../../../assets/features/formatDate'
import useDebounce from '../../../modules/hooks/useDebounce'
import { useGetAllTaskQuery } from '../../../api/taskApi/task.api'
import { firstTextToUpperCase } from '../../../../utils/helpers'
import { useGetUserByIdQuery } from '../../../api/userApi/user.api'
import UserLink from '../../UserLink'
import moment from 'moment'

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
  const debounced = useDebounce<{ task: string; master: string }>(search)
  const { data } = useGetAllTaskQuery('')

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
        showHeader={false}
        dataSource={data?.data}
        columns={columns}
        pagination={{ responsive: true, size: 'small', pageSize: 6 }}
      />
    </Card>
  )
}

export default Orders
