import { IDomain, IDomainService } from '@modules/models/Domain'
import { IFilter } from '../paymentApi/payment.api.types'
import { IStreet } from '../streetApi/street.api.types'

export type IRealestate = {
  domain: IDomain
  street: IStreet
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
  services: IDomainService[]
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
  streetsFilter: IFilter[]
}

export interface IDeleteRealestateResponse {
  success: boolean
}
