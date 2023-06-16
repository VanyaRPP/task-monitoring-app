export interface IPaymentTableData {
  id: number
  name: string
  lastAmount?: number
  amount: number
  price: number
  sum?: number
}

export interface IRentTableData extends IPaymentTableData {
  inflicionPrice?: number
}

export const dataSource: IPaymentTableData[] = [
  {
    id: 1,
    name: 'maintenance',
    amount: 0,
    price: 0,
    sum: 0,
  },
  {
    id: 2,
    name: 'placing',
    amount: 0,
    price: 0,
    sum: 0,
  },
  {
    id: 3,
    name: 'electricity',
    lastAmount: 0,
    amount: 0,
    price: 0,
    sum: 0,
  },
  {
    id: 4,
    name: 'water',
    lastAmount: 0,
    amount: 0,
    price: 0,
    sum: 0,
  },
]
