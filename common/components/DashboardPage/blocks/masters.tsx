import { masters as config } from '@common/lib/dashboard.config'
import TableCard from '@components/UI/TableCard'
import useDebounce from '@modules/hooks/useDebounce'
import { Avatar, Input, Table } from 'antd'
import { useEffect, useState } from 'react'

function removeDublicates(data) {
  return data.filter((value, index) => data.indexOf(value) === index)
}

const Masters = () => {
  const [data, setData] = useState(config)
  const [search, setSearch] = useState({ name: '' })
  const debounced = useDebounce<{ name: string }>(search)

  useEffect(() => {
    setData(
      config.filter((item) =>
        item.about.name.toLowerCase().includes(debounced.name.toLowerCase())
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
      title: searchInput('Ім`я'),
      dataIndex: 'about',
      key: 'about',
      width: '65%',
      render: (about) => {
        return (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Avatar
              src={about.avatar}
              size={32}
              style={{ width: '32px', maxWidth: '32px', minWidth: '32px' }}
            />

            <div>
              <h4>{about.name}</h4>
              <span style={{ opacity: '0.5' }}>{about.description}</span>
            </div>
          </div>
        )
      },
    },
    {
      title: 'Оцінка',
      dataIndex: 'rate',
      key: 'rate',
      width: '15%',
      sorter: (a, b) => a.rate - b.rate,
      render: (text) => <>{text} / 5</>,
    },
    {
      title: 'Спеціалізація',
      dataIndex: 'specials',
      key: 'specials',
      width: '20%',
      filters: removeDublicates(
        [].concat(...config.map((item) => item.specials))
      ).map((item) => {
        return { text: item, value: item }
      }),
      filterSearch: true,
      onFilter: (value: string, record) => record.specials.indexOf(value) === 0,
      render: (specials) => (
        <div style={{ display: 'flex', gap: '0 1rem', flexWrap: 'wrap' }}>
          {specials.map((item, index) => (
            <span key={index}>{item}</span>
          ))}
        </div>
      ),
    },
  ]

  return (
    <TableCard title="Майстри">
      <Table dataSource={data} columns={columns} pagination={false} />
    </TableCard>
  )
}

export default Masters
