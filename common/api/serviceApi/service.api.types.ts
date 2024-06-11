import { IService } from '@common/modules/models/Service'
import { IFilter } from '../paymentApi/payment.api.types'

type BaseGetServicesQueryRequest = {
  serviceId?: string[] | string
  domainId?: string[] | string
  streetId?: string[] | string
  month?: number[] | number
  year?: number[] | number
  limit?: number
  skip?: number
}
export type GetServicesQueryRequest =
  | BaseGetServicesQueryRequest
  | undefined
  | void

export type GetServicesQueryResponse = {
  data: IService[]
  filter: {
    street: IFilter[]
    domain: IFilter[]
    month: IFilter[]
    year: IFilter[]
  }
  total: number
}

export interface IAddServiceResponse {
  success: boolean
  data: IService
}

export interface IGetServiceResponse {
  success: boolean
  data: IService[]
  addressFilter: IFilter[]
  domainFilter: IFilter[]
}

export interface IDeleteServiceResponse {
  data: string
  success: boolean
}

export interface IServiceFilter {
  street: string
  domain: string
}
