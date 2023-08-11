import { IDomain } from '@common/modules/models/Domain'
import { IUser } from './../../modules/models/User'
import { IPaymentTableData } from '@utils/tableData'
import { ObjectId } from 'mongoose'
import { IRealestate } from '../realestateApi/realestate.api.types'

export interface IPaymentField {
  type: string
  lastAmount?: number
  amount?: number
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
}

export interface IPayment {
  invoiceNumber: number
  type: string
  date: Date
  domain: Partial<IDomain> | string
  street: string
  company: Partial<IRealestate> | string
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

interface IFilter {
  text: string
  value: string
}

export interface IGetPaymentResponse {
  totalPayments: { credit?: number; debit?: number }
  currentCompaniesCount: number
  currentDomainsCount: number
  domainsFilter: IFilter[]
  realEstatesFilter: IFilter[]
  data: IExtendedPayment[]
  success: boolean
  total: number
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
