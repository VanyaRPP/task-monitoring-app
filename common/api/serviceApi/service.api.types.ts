import { IDomain } from '@common/modules/models/Domain'
import { IStreet } from '@common/modules/models/Street'
import { IFilter } from '../paymentApi/payment.api.types'

export interface IService {
  _id: string
  domain: Partial<IDomain>
  street: Partial<IStreet>
  rentPrice: number
  date: Date
  electricityPrice: number
  waterPrice: number
  waterPriceTotal: number
  garbageCollectorPrice?: number
  inflicionPrice?: number
  description?: string
}

export interface IAddServiceResponse {
  success: boolean
  data: IService
}

export interface IGetServiceResponse {
  success: boolean
  data: IService[]
  addressFilter: IFilter[]
  domainFilter: IFilter[]
  yearFilter: IFilter[]
  monthFilter: IFilter[]
}

export interface IDeleteServiceResponse {
  data: string
  success: boolean
}

export interface IServiceFilter {
  street: string
  domain: string
  month: number
  year: number
}
