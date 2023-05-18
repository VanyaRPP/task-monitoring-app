import { IDomain } from 'common/modules/models/Domain'
import { ObjectId } from 'mongoose'
export type { IDomain } from 'common/modules/models/Domain'

export interface Domainstate {
  name: string
  address: string
  adminEmails: [string]
  streets: [ObjectId]
  description: string
  bankInformation: string
  phone: string
  email: string
}

export interface BaseQuery {
  success: boolean
  data: IDomain
}

export interface AllDomainQuery {
  success: boolean
  data: IDomain[]
}
