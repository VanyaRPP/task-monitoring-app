import { IDomain } from '@modules/models/Domain'
import { IStreet } from '@modules/models/Street'
import { IFilter } from '../paymentApi/payment.api.types'
import { ObjectId } from 'mongoose'
import { ServiceType } from '@utils/constants'

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
  customServices?: {
    _id: ObjectId
    label: string
    fieldName: string
    price: number
  }[]
  losses?: number
  consumedElectricity?: number
  generalElectricity?: number
  isVAT?: boolean
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
  total: number
}

export interface IDeleteServiceResponse {
  data: string
  success: boolean
}

export interface IServiceFilter {
  street: string
  domain: string
  company: string
  month: number
  year: number
}
