import { IDomain } from '@common/modules/models/Domain'
import { IFilter } from '@common/modules/models/Filter'

export interface IDomainModel {
  name: string
  adminEmails: [string]
  streets: string[]
  description: string
}

export interface IExtendedDomain extends IDomainModel {
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

// TODO: global api types
export type EmptyRequest = undefined | null | void

// TODO: global api types
export type BaseGetRequest =
  | {
      skip?: number
      limit?: number
    }
  | EmptyRequest

export type GetDomainsRequest = BaseGetRequest & {
  domainId?: string | string[]
  streetId?: string | string[]
  adminEmails?: string | string[]
}

export type GetDomainsResponse = { data: IDomain[]; total: number }

export type GetDomainsFiltersRequest = EmptyRequest
export type GetDomainsFiltersResponse = {
  domains: IFilter[]
  streets: IFilter[]
  adminEmails: IFilter[]
}
