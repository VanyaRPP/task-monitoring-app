import { IFilter } from '@common/modules/models/Filter'
import { IPayment } from '@common/modules/models/Payment'
import { ServiceType } from '@utils/constants'
import { ObjectId } from 'mongoose'
import { IUser } from './../../modules/models/User'

type BaseGetPaymentsQueryRequest = {
  paymentId?: string[] | string
  domainId?: string[] | string
  streetId?: string[] | string
  companyId?: string[] | string
  serviceId?: string[] | string
  type?: 'debit' | 'credit' | ('debit' | 'credit')[]
  month?: number[] | number
  year?: number[] | number
  limit?: number
  skip?: number
}
export type GetPaymentsQueryRequest =
  | BaseGetPaymentsQueryRequest
  | undefined
  | void

export type GetPaymentsQueryResponse = {
  data: IPayment[]
  filter: {
    domain: IFilter[]
    street: IFilter[]
    company: IFilter[]
    monthService: IFilter[]
    type: IFilter[]
    month: IFilter[]
    year: IFilter[]
  }
  total: number
}

export interface IPaymentField {
  type: ServiceType | string
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

export interface IAddPaymentResponse {
  success: boolean
  data: IPayment
}

export interface IGetPaymentResponse {
  totalPayments: {
    generalSum?: number
    credit?: number
    debit?: number
    maintenancePrice?: number
    inflicionPrice?: number
    discount?: number
    waterPart?: number
    electricityPrice?: number
    garbageCollectorPrice?: number
    cleaningPrice?: number
    waterPrice?: number
    custom?: number
    placingPrice?: number
  }
  currentCompaniesCount: number
  currentDomainsCount: number
  domainsFilter: IFilter[]
  realEstatesFilter: IFilter[]
  addressFilter: IFilter[]
  data: IPayment[]
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

export interface IGeneratePaymentPDF {
  payments: IPayment[]
}

export interface IGeneratePaymentPDFResponce {
  buffer: Buffer
  fileName: string
  fileExtension: string
}
