import { IUser } from './../../modules/models/User'
import { IPaymentTableData } from '@utils/tableData'
import { ObjectId } from 'mongoose'

export interface IPayment {
  payer: IExtendedPayment | ObjectId | IUser['_id'] | string
  date?: Date
  credit?: number
  debit?: number
  description?: string
  maintenance?: IPaymentTableData
  placing?: IPaymentTableData
  electricity?: IPaymentTableData
  water?: IPaymentTableData
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
