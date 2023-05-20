import { ObjectId } from 'mongoose'

// export interface BaseQuery {
//   success: boolean
//   data: IDomain
// }

// export interface AllDomainQuery {
//   success: boolean
//   data: IDomain[]
// }

export interface IDomainModel {
  name: string
  address: string
  adminEmails: [string]
  streets: [ObjectId]
  description: string
  bankInformation: string
  phone: string
  email: string
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
  success: boolean
}
