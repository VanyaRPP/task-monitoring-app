import { IDomain } from '@common/modules/models/Domain'

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
}

export interface IDeleteRealestateResponse {
  success: boolean
}
