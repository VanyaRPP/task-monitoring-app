import { ObjectId } from 'mongoose'

export interface IPayment {
  payer: ObjectId | string
  date?: Date
  credit: number
  debit: number
  description: string
}

export interface IExtendedPayment extends IPayment {
  _id: string
  _v: number
}

export interface IAddPaymentResponse {
  success: boolean
  data: IExtendedPayment
}

export interface IGetPaymentResponse {
  success: boolean
  data: IExtendedPayment[]
}

export interface IDeletePaymentResponse {
  data: string
  success: boolean
}
