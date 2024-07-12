import { IStreet } from '@common/modules/models/Street'
export type { IStreet } from 'common/modules/models/Street'
import { IFilter } from '../paymentApi/payment.api.types'

export interface AllStreetsQuery {
  success: boolean
  data: IStreet[]
}

export interface BaseQuery {
  success: boolean
  data: IStreet
}

export interface IStreetFilter {
  street: string
  domain: string
}

export interface IGetStreetResponse {
  success: boolean
  data: IStreet[]
  addressFilter: IFilter[]
  domainFilter: IFilter[]
}
