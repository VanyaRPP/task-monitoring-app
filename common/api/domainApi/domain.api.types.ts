import { IDomain } from 'common/modules/models/Domain'
export type { IDomain } from 'common/modules/models/Domain'

export interface Domainstate {
  name: string
  address: string
  adminEmails: [string]
  streets: [string] //  Streets id
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
