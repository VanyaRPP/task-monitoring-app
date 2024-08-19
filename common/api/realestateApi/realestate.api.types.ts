import { IFilter } from '@common/modules/models/Filter'
import { IRealEstate } from '@common/modules/models/RealEstate'

export type BaseGetQueryRequest = {
  limit?: number
  skip?: number
}

export type BaseGetCompaniesQueryRequest = {
  companyId?: string[] | string
  name?: string[] | string
  streetId?: string[] | string
  domainId?: string[] | string
  adminEmail?: string[] | string
}

export type CompaniesFilter = {
  name: IFilter[]
  street: IFilter[]
  domain: IFilter[]
  adminEmails: IFilter[]
}

export type GetCompaniesQueryRequest =
  | (BaseGetQueryRequest & BaseGetCompaniesQueryRequest)
  | undefined
  | void
export type GetCompaniesQueryResponse = {
  data: IRealEstate[]
  filter: CompaniesFilter
  total: number
}

export interface IAddRealestateResponse {
  success: boolean
  data: IRealEstate
}

export interface IGetRealestateResponse {
  success: boolean
  data: IRealEstate[]
  domainsFilter: IFilter[]
  realEstatesFilter: IFilter[]
  streetsFilter: IFilter[]
}

export interface IDeleteRealestateResponse {
  success: boolean
}
