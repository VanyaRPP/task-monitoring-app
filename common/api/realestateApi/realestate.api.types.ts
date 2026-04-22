import { IDomain, IDomainService } from '@modules/models/Domain'
import { IFilter } from '../paymentApi/payment.api.types'
import { IStreet } from '../streetApi/street.api.types'
import { ObjectId } from 'mongoose'

export type IRealestate = {
  _id?: string
  domain: IDomain
  street: IStreet
  companyName: string
  adminEmails: string[]
  pricePerMeter: number
  servicePricePerMeter?: number
  totalArea: number
  description: string
  currency?: string
  garbageCollector?: boolean
  archived?: boolean
  rentPart?: number
  inflicion?: boolean
  waterPart?: number
  discount?: number
  cleaning?: number
  services: IDomainService[]
  customServices?: CustomServices[]
  account?: string
  rnokpp?: string
  defaultTemplate?: string
}

export interface CustomServices {
  _id: string
  label: string
  fieldName: string
  price: number
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

export interface IArchived {
  _id?: string
  archived?: boolean
  success: boolean
}

export interface IExtendedArchive extends IArchived {
  _id: string
  _v: number
}
