export const dataSource = [
  {
    key: '1',
    date: '12.12.2023',
    name: 'test',
    debit: 200,
    credit: 500,
    description: 'natberh',
  },
  {
    key: '2',
    date: '11.12.2023',
    name: 'test',
    debit: 200,
    credit: 500,
    description: 'Olimp',
  },
  {
    key: '3',
    date: '10.11.2023',
    name: 'test',
    debit: 200,
    credit: 500,
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
    title: 'Назва',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: 'Дебет',
    dataIndex: 'debit',
    key: 'debit',
  },
  {
    title: 'Кредит',
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
