import { useState, useEffect } from 'react'
import { Card, Table, Input } from 'antd'
import useDebounce from 'common/assets/hooks/useDebounce'
import s from './style.module.scss'

import { auction as config } from 'common/lib/task.config'

const AuctionCard = ({ taskId }) => {
  const [data, setData] = useState(config)
  const [search, setSearch] = useState({ name: '', address: '' })
  const debounced = useDebounce<{ name: string; address: string }>(search)

  useEffect(() => {
    setData(
      config.filter((item) =>
        item.name.toLowerCase().includes(debounced.name.toLowerCase())
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
      title: searchInput('name'),
      dataIndex: 'name',
      key: 'name',
      width: '70%',
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: '15%',
      sorter: (a, b) => a.price - b.price,
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      width: '15%',
      sorter: (a, b) => a.rating - b.rating,
    },
  ]

  return (
    <Card className={s.Card} title={`Auction: ${config.length}`}>
      <Table dataSource={data} columns={columns} pagination={false} />
    </Card>
  )
}

export default AuctionCard
