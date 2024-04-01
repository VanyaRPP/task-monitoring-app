import { IDomain } from '@common/modules/models/Domain'
import { IFilter } from '../paymentApi/payment.api.types'
import { IStreet } from '@common/modules/models/Street'
import mongoose from 'mongoose'

export interface IService {
  _id: mongoose.Types.ObjectId
  domain: IDomain
  street: IStreet
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
}

export interface IDeleteServiceResponse {
  data: string
  success: boolean
}

export interface IServiceFilter {
  street: string
  domain: string
}
