import { IUser } from './../../modules/models/User'
import { IPaymentTableData } from '@utils/tableData'
import { ObjectId } from 'mongoose'

type ServiceType = {
  type: string
  lastAmount?: number
  amount: number
  price: number
  sum: number
}

export interface IPayment {
  type: string
  date: Date
  domain: ObjectId
  street: ObjectId
  company: ObjectId
  service: ObjectId
  credit: number
  debit: number
  electricity: IPaymentTableData
  water: IPaymentTableData
  placing: IPaymentTableData
  maintenance: IPaymentTableData
  description?: string
  services?: IPaymentTableData[]
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

export interface IPayer {
  email: string
  _id: ObjectId | string | IUser['_id']
}
