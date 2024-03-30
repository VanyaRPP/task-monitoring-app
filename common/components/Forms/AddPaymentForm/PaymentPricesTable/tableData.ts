import { ServiceType } from '../../../../../utils/constants'

export interface IPaymentTableData {
  id?: number
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

export const electricityObj = {
  name: ServiceType.Electricity,
  lastAmount: 0,
  amount: 0,
  price: 0,
  sum: 0,
}
