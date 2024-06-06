import { IRealEstate } from '@common/modules/models/RealEstate'
import { IFilter } from '../paymentApi/payment.api.types'

export type BaseGetQueryRequest = {
  limit?: number
  skip?: number
}

export type GetCompaniesQueryRequest =
  | (BaseGetQueryRequest & {
      companyId?: string[] | string
      streetId?: string[] | string
      domainId?: string[] | string
      companyName?: string[] | string
      adminEmail?: string[] | string
    })
  | undefined
export type GetCompaniesQueryResponse = {
  data: IRealEstate[]
  filter: {
    companyName: IFilter[]
    domain: IFilter[]
    street: IFilter[]
    adminEmails: IFilter[]
  }
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
