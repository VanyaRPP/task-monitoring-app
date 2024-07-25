import { IDomain } from '@common/modules/models/Domain'

export interface IExtendedDomain extends IDomain {
  _id: string
  _v: number
}

export interface IAddDomainResponse {
  success: boolean
  data: IExtendedDomain
}

export interface IGetDomainResponse {
  success: boolean
  data: IExtendedDomain[]
}

export interface IDeleteDomainResponse {
  data: string
  success: boolean
}
export interface IExtendedAreas {
  _id: string
  companies: companyAreas[]
  totalArea: number
}
export interface companyAreas {
  totalArea: number
  companyName: string
  rentPart: number
}

export interface IGetAreasResponse {
  success: boolean
  data: IExtendedAreas
}
