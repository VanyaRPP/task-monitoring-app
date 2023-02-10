import moment from 'moment'

export const dataSource = [
  {
    key: '1',
    date: '12.12.2023',
    debit: '200',
    credit: '',
    description: 'natberh',
  },
  {
    key: '2',
    date: '11.12.2023',
    debit: '200',
    credit: '',
    description: 'Olimp',
  },
  {
    key: '3',
    date: '10.11.2023',
    debit: '200',
    credit: '',
    description: 'Somebody',
  },
]

export const columns = [
  {
    title: 'Дата',
    dataIndex: 'date',
    key: 'date',
    render: (date) => moment(date).format('DD-MM-YYYY'),
  },
  {
    title: 'Дебет(Реалізація)',
    dataIndex: 'debit',
    key: 'debit',
    width: '20%',
    render: (debit) => (debit === '0' ? undefined : debit),
  },
  {
    title: 'Кредит(Оплата)',
    dataIndex: 'credit',
    key: 'credit',
    width: '20%',
    render: (credit) => (credit === '0' ? undefined : credit),
  },
  {
    title: 'Опис',
    dataIndex: 'description',
    key: 'description',
    width: '40%',
    ellipsis: true,
  },
]
