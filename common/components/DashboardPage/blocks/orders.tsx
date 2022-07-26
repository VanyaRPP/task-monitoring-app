import React, { useEffect, useState } from 'react'
import { Card, Table, Input, Button } from 'antd'
import { dateToDefaultFormat } from '../../../assets/features/formatDate'
import { orders as config } from 'common/lib/dashboard.config'
import useDebounce from '../../../modules/hooks/useDebounce'
import Router from 'next/router'
import { useGetUserByEmailQuery } from '../../../api/userApi/user.api'
import { useSession } from 'next-auth/react'

interface Props {
  style?: string
}

const Orders: React.FC<Props> = ({ style }) => {

  const { data: session } = useSession()

  const { data: userData, isLoading } = useGetUserByEmailQuery(
    session?.user?.email
  )
  const user = userData?.data

  const [data, setData] = useState(config)
  const [search, setSearch] = useState({ task: '', master: '' })
  const debounced = useDebounce<{ task: string; master: string }>(search)

  useEffect(() => {
    setData(
      config.filter(
        (item) =>
          item.task.toLowerCase().includes(debounced.task.toLowerCase()) &&
          item.master.toLowerCase().includes(debounced.master.toLowerCase())
      )
    )
  }, [debounced])

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
      dataIndex: 'task',
      key: 'task',
      width: '35%',
    },
    {
      title: searchInput('Майстер'),
      dataIndex: 'master',
      key: 'master',
      width: '25%',
    },
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      width: '20%',
      sorter: (a, b) => Date.parse(a.date) - Date.parse(b.date),
      render: (text) => dateToDefaultFormat(text),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: '20%',
      filters: [
        {
          text: 'Pending',
          value: 'Pending',
        },
        {
          text: 'Done',
          value: 'Done',
        },
      ],
      onFilter: (value: string, record) => record.status.indexOf(value) === 0,
    },
  ]

  return (
    <Card
      className={style}
      title="Мої замовлення"
      style={{ flex: '1.5' }}
      extra={
        <Button
          onClick={() => Router.push(`/task/user/${user?._id}`)}
          ghost
          type="primary"
        >
          Всі
        </Button>
      }
    >
      <Table dataSource={data} columns={columns} pagination={false} />
    </Card>
  )
}

export default Orders
