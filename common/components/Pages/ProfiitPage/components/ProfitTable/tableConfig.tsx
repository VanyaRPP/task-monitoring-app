import { Profit } from '@common/api/profitsApi/profits.type'
import { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import 'dayjs/locale/uk'

dayjs.locale('uk')


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
    title: 'Місяць',
    dataIndex: 'month',
    key: 'month',
    render: (month: string) =>
      dayjs(month).isValid() ? dayjs(month).format('MMMM YYYY') : month,
  },

  {
    title: 'Витрати',
    dataIndex: 'debit',
    key: 'debit',
    render: (value: number) => value.toFixed(2),
  },
  {
    title: 'Надходження',
    dataIndex: 'credit',
    key: 'credit',
    render: (value: number) => value.toFixed(2),
  },
  {
    title: 'Прибуток',
    dataIndex: 'profit',
    key: 'profit',
    render: (value: number) => (
      <span style={{ color: value >= 0 ? 'green' : 'red' }}>
        {value.toFixed(2)}
      </span>
    ),
  },
  {
    title: 'Усього записів',
    dataIndex: 'count',
    key: 'count',
  },
]

export const childColumns: ColumnsType<Profit> = [
  {
    title: 'Дата',
    dataIndex: 'date',
    key: 'date',
    render: (date: string) => new Date(date).toLocaleDateString(),
  },
  {
    title: 'Тип',
    dataIndex: 'type',
    key: 'type',
    render: (type: string) => {
      if (type === 'debit') return 'Дебет'
      if (type === 'credit') return 'Кредит'
      return type
    },
  },
  {
    title: 'Сума',
    dataIndex: 'amount',
    key: 'amount',
  },
  {
    title: 'Опис',
    dataIndex: 'description',
    key: 'description',
  },
  {
    title: 'Категорії',
    dataIndex: 'categories',
    key: 'categories',
    render: (cats: string[]) => cats?.join(', ') || '-',
  },
]
