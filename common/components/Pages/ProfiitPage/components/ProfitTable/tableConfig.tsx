import { Profit } from '@common/api/profitsApi/profits.type'
import { ColumnsType } from 'antd/es/table'
import type { TFunction } from 'i18next'
import dayjs from 'dayjs'

interface ProfitMonthSummary {
  key: string
  month: string
  debit: number
  credit: number
  profit: number
  count: number
  transactions: Profit[]
}

export const getParentColumns = (
  t: TFunction
): ColumnsType<ProfitMonthSummary> => [
  {
    title: t('table.parent.month'),
    dataIndex: 'month',
    key: 'month',
    render: (month: string) =>
      dayjs(month).isValid() ? dayjs(month).format('MMMM YYYY') : month,
  },

  {
    title: t('table.parent.debit'),
    dataIndex: 'debit',
    key: 'debit',
    render: (value: number) => value.toFixed(2),
  },
  {
    title: t('table.parent.credit'),
    dataIndex: 'credit',
    key: 'credit',
    render: (value: number) => value.toFixed(2),
  },
  {
    title: t('table.parent.profit'),
    dataIndex: 'profit',
    key: 'profit',
    render: (value: number) => (
      <span style={{ color: value >= 0 ? 'green' : 'red' }}>
        {value.toFixed(2)}
      </span>
    ),
  },
  {
    title: t('table.parent.totalRecords'),
    dataIndex: 'count',
    key: 'count',
  },
]

export const getChildColumns = (t: TFunction): ColumnsType<Profit> => [
  {
    title: t('table.child.date'),
    dataIndex: 'date',
    key: 'date',
    render: (date: string) => new Date(date).toLocaleDateString(),
  },
  {
    title: t('table.child.type'),
    dataIndex: 'type',
    key: 'type',
    render: (type: string) => {
      if (type === 'debit') return 'Дебет'
      if (type === 'credit') return 'Кредит'
      return type
    },
  },
  {
    title: t('table.child.amount'),
    dataIndex: 'amount',
    key: 'amount',
  },
  {
    title: t('table.child.description'),
    dataIndex: 'description',
    key: 'description',
  },
  {
    title: t('table.child.categories'),
    dataIndex: 'categories',
    key: 'categories',
    render: (cats: string[]) => cats?.join(', ') || '-',
  },
]

