import { IPaymentTableData } from '@common/components/Forms/AddPaymentForm/PaymentPricesTable/tableData'
import { IDomain } from '@common/modules/models/Domain'
import { ObjectId } from 'mongoose'
import { IRealestate } from '../realestateApi/realestate.api.types'
import { IUser } from './../../modules/models/User'

export interface IPaymentField {
  type: string
  name?: string
  lastAmount?: number
  amount?: number
  price: number
  sum: number
}

export interface IProvider {
  description: string
}

export interface IReciever {
  companyName: string
  adminEmails: string[]
  description: string
}

export interface IPayment {
  invoiceNumber: number
  type: string
  invoiceCreationDate: Date
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

export interface IFilter {
  text: string
  value: string | number
}

export interface IGetPaymentResponse {
  totalPayments: { credit?: number; debit?: number }
  currentCompaniesCount: number
  currentDomainsCount: number
  dateFilters: {
    years: number[]
    quartes: number[] // ?????
    months: number[]
  }
  domainsFilter: IFilter[]
  realEstatesFilter: IFilter[]
  yearFilter: IFilter[]
  monthFilter: IFilter[]
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

export interface IGetPaymentNumberResponse {
  success: boolean
  data: number
}
