import { IDomain } from 'common/modules/models/Domain'
export type { IDomain } from 'common/modules/models/Domain'

export interface BaseQuery {
  success: boolean
  data: IDomain
}

export interface AllDomainQuery {
  success: boolean
  data: IDomain[]
}
