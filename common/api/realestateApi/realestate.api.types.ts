import { IDomain } from '@common/modules/models/Domain'

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

interface IFilter {
  text: string
  value: string
}
export interface IGetRealestateResponse {
  domainsFilter: IFilter[]
  realEstatesFilter: IFilter[]
  data: IExtendedRealestate[]
  success: boolean
  total: number
}

export interface IDeleteRealestateResponse {
  success: boolean
}

export interface IGetRealestateCountResponse {
  success: boolean
  data: number
}
