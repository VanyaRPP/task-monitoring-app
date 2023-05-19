import { IDomain } from 'common/modules/models/Domain'
import { ObjectId } from 'mongoose'
export type { IDomain } from 'common/modules/models/Domain'

export interface BaseQuery {
  success: boolean
  data: IDomain
}

export interface AllDomainQuery {
  success: boolean
  data: IDomain[]
}
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
  success: boolean
}
