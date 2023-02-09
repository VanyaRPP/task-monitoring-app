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
  },
  {
    title: 'Дебет(Реалізація)',
    dataIndex: 'debit',
    key: 'debit',
  },
  {
    title: 'Кредит(Оплата)',
    dataIndex: 'credit',
    key: 'credit',
  },
  {
    title: 'Опис',
    dataIndex: 'description',
    key: 'description',
    width: '20%',
  },
]
