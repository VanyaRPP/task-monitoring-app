export interface ITableData {
  id: string
  name: string
  lastAmount?: number
  amount: number
  price: number
  sum?: number
}

export const dataSource: ITableData[] = [
  {
    id: '1',
    name: 'Утримання',
    amount: 0,
    price: 0,
  },
  {
    id: '2',
    name: 'Розміщення',
    amount: 0,
    price: 0,
  },
  {
    id: '3',
    name: 'Електропостачання',
    lastAmount: 0,
    amount: 0,
    price: 0,
  },
  {
    id: '4',
    name: 'Водопостачання',
    lastAmount: 0,
    amount: 0,
    price: 0,
  },
]
