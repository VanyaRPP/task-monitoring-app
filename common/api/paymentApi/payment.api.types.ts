import { IService } from '@common/api/serviceApi/service.api.types'
import { IDomain } from '@modules/models/Domain'
import { IStreet } from '@modules/models/Street'
import { IUser } from '@modules/models/User'
import { ServiceType } from '@utils/constants'
import { ObjectId } from 'mongoose'
import { IRealestate } from '../realestateApi/realestate.api.types'

export type TemplateScope = 'company' | 'domain' | 'payment'
export type TemplateScopeTarget = Exclude<TemplateScope, 'payment'>

export interface IPaymentField {
  type: ServiceType | string
  name?: string
  customName?: string
  description?: string
  customService?: boolean
  isIndividual?: boolean
  serviceId?: string
  lastAmount?: number
  losses?: number
  amount?: number
  price: number
  sum: number
  fieldName?: string
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
  domain: Partial<IDomain> | any
  // optional: street-less companies omit it (sending '' fails the ObjectId cast)
  street?: Partial<IStreet> | string
  company: Partial<IRealestate> | string
  monthService: Partial<IService> | string
  description?: string
  invoice: IPaymentField[]
  provider: IProvider
  reciever: IReciever
  generalSum: number
  currency?: string
  transaction?: IPaymentTransactions
  losses?: number
  template?: string
  _templateScope?: TemplateScopeTarget
  invoiceLang?: 'en' | 'uk'
  _bulk?: boolean
  _batchId?: string
}

export interface IExtendedPayment extends IPayment {
  someUniqueField?: string
  _id: string
  _v: number
}

export interface IExtendedCostPayment extends ICostPayment {
  someUniqueField?: string
  _id: string
  _v: number
}

export interface IAddPaymentResponse {
  success: boolean
  data: IExtendedPayment
}

export interface IAddCostPaymentResponse {
  success: boolean
  data: IExtendedCostPayment
}

export interface IFilter {
  text: string
  value: any
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

export interface IHtmlToPdfRequest {
  html: string
  fileName?: string
}

export interface IHtmlToPdfResponse {
  buffer: Buffer
  fileName: string
  fileExtension: string
}

export interface IHtmlToPdfItem {
  html: string
  fileName: string
}

export interface IHtmlToPdfZipRequest {
  items: IHtmlToPdfItem[]
  zipName?: string
}

export interface IHtmlToPdfZipResponse {
  buffer: Buffer
  fileName: string
  fileExtension: string
}

export interface IGetCostPaymentResponse {
  success: boolean
  date: string
  totalGeneralSumCredit: number
  totalGeneralSumDebit: number
  paymentsByType: {
    credit: ICostPayment[]
    debit: ICostPayment[]
  }
  data: any
}

export interface ICostPayment {
  date: Date
  sum: number
  description: string
}

export interface IGeneratePaymentExcel {
  payments: IExtendedPayment[]
}

export interface IGeneratePaymentExcelResponce {
  buffer: {
    data: Buffer
  }
  fileName: string
  fileExtension: string
}

export interface IPaymentTransactions {
  AUT_CNTR_ACC: string
  AUT_CNTR_NAM: string
  AUT_CNTR_MFO: string
  Description: string
}

export interface IPaymentInvoiceSnapshot {
  invoiceNumber: number
  invoiceCreationDate: Date
  invoice: IPaymentField[]
  provider: IProvider
  reciever: IReciever
  generalSum: number
  description?: string
  type: string
}

export type PaymentActionType =
  | 'CREATE'
  | 'BULK_CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'BULK_DELETE'
  | 'MARK_PAID'
  | 'RESTORE'

export type PaymentMutationSource =
  | 'single'
  | 'bulk'
  | 'quick-pay'
  | 'admin-restore'

export type IPaymentSnapshot = Omit<IPayment, '_id'> & { _id: string }

export interface AuditFilters {
  page?: number
  limit?: number
  actorEmail?: string
  actionType?: PaymentActionType | PaymentActionType[]
  source?: PaymentMutationSource | PaymentMutationSource[]
  domainId?: string
  from?: string
  to?: string
}

export interface IPaymentChangeLog {
  _id: string
  paymentId: string
  date: string
  reason?: string
  actorId?: string
  actorEmail?: string
  actionType?: PaymentActionType
  source?: PaymentMutationSource
  before?: IPaymentSnapshot
  after?: IPaymentSnapshot
  domainId?: string
  companyId?: string
  domainName?: string
  companyName?: string
  batchId?: string
  invoiceData: IPaymentInvoiceSnapshot
}

export interface IGetPaymentChangeLogsResponse {
  success: boolean
  data: IPaymentChangeLog[]
}

export interface ICreatePaymentChangeLogResponse {
  success: boolean
  data: IPaymentChangeLog
}
export interface IDeletePaymentChangeLogResponse {
  success: boolean
}
