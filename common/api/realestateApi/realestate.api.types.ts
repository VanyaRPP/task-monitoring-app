import { IDomain } from '@common/modules/models/Domain'
import { IFilter } from '../paymentApi/payment.api.types'

export type IRealestate = {
  domain: IDomain
  street: string
  companyName: string
  adminEmails: string[]
  pricePerMeter: number
  servicePricePerMeter?: number
  totalArea: number
  description: string
  garbageCollector?: boolean
  rentPart?: number
  inflicion?: boolean
  waterPart?: number
  discount?: number
  cleaning?: number
}

export interface IExtendedRealestate extends IRealestate {
  _id: string
  _v: number
}

export interface IAddRealestateResponse {
  success: boolean
  data: IExtendedRealestate
}

export interface IGetRealestateResponse {
  success: boolean
  data: IExtendedRealestate[]
  domainsFilter: IFilter[]
  realEstatesFilter: IFilter[]
}

export interface IDeleteRealestateResponse {
  success: boolean
}
