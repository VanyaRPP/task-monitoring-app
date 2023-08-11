export interface IPaymentTableData {
  id: number
  name: string
  type?: string
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
    name: 'maintenancePrice',
    amount: 0,
    price: 0,
    sum: 0,
  },
  {
    id: 2,
    name: 'placingPrice',
    amount: 0,
    price: 0,
    sum: 0,
  },
  {
    id: 3,
    name: 'electricityPrice',
    lastAmount: 0,
    amount: 0,
    price: 0,
    sum: 0,
  },
  {
    id: 4,
    name: 'waterPrice',
    lastAmount: 0,
    amount: 0,
    price: 0,
    sum: 0,
  },
]
