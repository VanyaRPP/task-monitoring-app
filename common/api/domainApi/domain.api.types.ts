import { IDomain } from '@common/modules/models/Domain'
import { IFilter } from '@common/modules/models/Filter'

export type BaseGetQueryRequest = {
  limit?: number
  skip?: number
}

export type GetDomainsQueryRequest =
  | (BaseGetQueryRequest & {
      domainId?: string[] | string
      name?: string[] | string
      streetId?: string[] | string
      adminEmail?: string[] | string
    })
  | undefined
export type GetDomainsQueryResponse = {
  data: IDomain[]
  filter: {
    name: IFilter[]
    streets: IFilter[]
    adminEmails: IFilter[]
  }
  total: number
}

export interface IAddDomainResponse {
  success: boolean
  data: IDomain
}

export interface IGetDomainResponse {
  success: boolean
  data: IDomain[]
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
