import React, { useEffect, useState } from 'react'
import { Card, Table, Input } from 'antd'
import useDebounce from 'common/modules/hooks/useDebounce'
import { domains as config } from 'common/lib/dashboard.config'

interface Props {
  style?: string
}

const Domains: React.FC<Props> = ({ style }) => {
  const [data, setData] = useState(config)
  const [search, setSearch] = useState({ name: '', address: '' })
  const debounced = useDebounce<{ name: string; address: string }>(search)

  useEffect(() => {
    setData(
      config.filter(
        (item) =>
          item.name.toLowerCase().includes(debounced.name.toLowerCase()) &&
          item.address.toLowerCase().includes(debounced.address.toLowerCase())
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
      title: searchInput('Назва'),
      dataIndex: 'name',
      key: 'name',
      width: '35%',
    },
    {
      title: searchInput('Адреса'),
      dataIndex: 'address',
      key: 'address',
      width: '50%',
    },
    {
      title: 'Оцінка',
      dataIndex: 'rate',
      key: 'rate',
      width: '15%',
      sorter: (a, b) => a.rate - b.rate,
      render: (text) => <>{text} / 5</>,
    },
  ]

  return (
    <Card className={style} title="Домени" style={{ flex: '1.5' }}>
      <Table dataSource={data} columns={columns} pagination={false} />
    </Card>
  )
}

export default Domains
