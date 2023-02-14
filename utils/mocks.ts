import { dateToDefaultFormat } from '@common/assets/features/formatDate'

export const columns = [
  {
    title: 'Дата',
    dataIndex: 'date',
    key: 'date',
    render: (date) => dateToDefaultFormat(date),
  },
  {
    title: 'Дебет (Реалізація)',
    dataIndex: 'debit',
    key: 'debit',
    width: '20%',
    render: (debit) => (debit === 0 ? null : debit),
  },
  {
    title: 'Кредит (Оплата)',
    dataIndex: 'credit',
    key: 'credit',
    width: '20%',
    render: (credit) => (credit === 0 ? null : credit),
  },
  {
    title: 'Опис',
    dataIndex: 'description',
    key: 'description',
    width: '40%',
    ellipsis: true,
  },
]
