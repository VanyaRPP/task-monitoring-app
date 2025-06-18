import { Profit } from '@common/api/profitsApi/profits.type'
import { ColumnsType } from 'antd/es/table'

interface ProfitMonthSummary {
  key: string
  month: string
  debit: number
  credit: number
  profit: number
  count: number
  transactions: Profit[]
}

export const parentColumns: ColumnsType<ProfitMonthSummary> = [
  {
    title: 'Month',
    dataIndex: 'month',
    key: 'month',
  },
  {
    title: 'Debit',
    dataIndex: 'debit',
    key: 'debit',
    render: (value: number) => value.toFixed(2),
  },
  {
    title: 'Credit',
    dataIndex: 'credit',
    key: 'credit',
    render: (value: number) => value.toFixed(2),
  },
  {
    title: 'Profit',
    dataIndex: 'profit',
    key: 'profit',
    render: (value: number) => (
      <span style={{ color: value >= 0 ? 'green' : 'red' }}>
        {value.toFixed(2)}
      </span>
    ),
  },
  {
    title: 'Total Records',
    dataIndex: 'count',
    key: 'count',
  },
]

export const childColumns: ColumnsType<Profit> = [
  {
    title: 'Date',
    dataIndex: 'date',
    key: 'date',
    render: (date: string) => new Date(date).toLocaleDateString(),
  },
  {
    title: 'Type',
    dataIndex: 'type',
    key: 'type',
  },
  {
    title: 'Amount',
    dataIndex: 'amount',
    key: 'amount',
  },
  {
    title: 'Description',
    dataIndex: 'description',
    key: 'description',
  },
  {
    title: 'Categories',
    dataIndex: 'categories',
    key: 'categories',
    render: (cats: string[]) => cats?.join(', ') || '-',
  },
]
