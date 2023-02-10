export interface IPayment {
  _id: string
  _v: number
  date: Date
  credit: string
  debit: string
  description: string
}

export interface IAddPayment {
  date: Date
  credit: string
  debit: string
  description: string
}

export interface IPaymentResponse {
  success: boolean
  data: IPayment | IPayment[]
}
