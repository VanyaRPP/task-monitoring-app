import { IDomain } from '@common/modules/models/Domain';

export type IRealestate = {
  domain: IDomain
  street: string
  companyName: string
  bankInformation: string
  agreement: string
  phone: string
  adminEmails: string[]
  pricePerMeter: number
  servicePricePerMeter: number
  totalArea: number
  garbageCollector: number
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
