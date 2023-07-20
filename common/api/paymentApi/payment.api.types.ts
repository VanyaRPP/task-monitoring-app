import { IUser } from './../../modules/models/User'
import { IPaymentTableData } from '@utils/tableData'
import { ObjectId } from 'mongoose'

export interface IPaymentField {
  type: string
  lastAmount?: number
  amount: number
  price: number
  sum: number
}

export interface IProvider {
  name: string
  address: string
  bankInformation: string
}

export interface IReciever {
  companyName: string
  adminEmails: string[]
  phone: string
}

export interface IPayment {
  invoiceNumber: number
  type: string
  date: Date
  domain: string
  street: string
  company: string
  monthService: string
  description?: string
  services?: IPaymentTableData[]
  invoice: IPaymentField[]
  provider: IProvider
  reciever: IReciever
  generalSum: number
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
  currentCompaniesCount: number
  currentDomainsCount: number
}

export interface IDeletePaymentResponse {
  data: string
  success: boolean
}

export interface IPayer {
  email: string
  _id: ObjectId | string | IUser['_id']
}

export interface IGetPaymentsCountResponse {
  success: boolean
  data: number
}
