import { IFilter } from "../paymentApi/payment.api.types"

export interface IService {
  domain: string
  street: string
  rentPrice: number
  date: Date
  electricityPrice: number
  waterPrice: number
  waterPriceTotal: number
  garbageCollectorPrice?: number
  inflicionPrice?: number
  description?: string
}

export interface IExtendedService extends IService {
  _id: string
  _v: number
}

export interface IAddServiceResponse {
  success: boolean
  data: IExtendedService
}

export interface IGetServiceResponse {
  success: boolean
  data: IExtendedService[]
  addressFilter: IFilter[]
  domainFilter: IFilter[]
}

export interface IDeleteServiceResponse {
  data: string
  success: boolean
}
