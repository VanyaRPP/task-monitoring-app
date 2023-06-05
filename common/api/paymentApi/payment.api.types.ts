import { IUser } from './../../modules/models/User'
import { IPaymentTableData } from '@utils/tableData'
import { ObjectId } from 'mongoose'

interface PaymentData {
  type: string
  lastAmount?: number
  amount: number
  price: number
  sum: number
}

interface IProvider {
  name: string
  address: string
  bankInformation: string
}

interface IReciever {
  companyName: string
  emails: string[]
  phone: string
}

export interface IPayment {
  type: string
  date: Date
  domain: ObjectId
  street: ObjectId
  company: ObjectId
  service: ObjectId
  description?: string
  services?: IPaymentTableData[]
  invoice: PaymentData[]
  from: IProvider
  to: IReciever
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
