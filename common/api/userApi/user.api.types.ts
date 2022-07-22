import { IUser } from 'common/modules/models/User'
export type { IUser } from 'common/modules/models/User'

export interface BaseQuery {
  success: boolean
  data: IUser
}

export interface AllUsersQuer {
  success: boolean
  data: IUser[]
}
