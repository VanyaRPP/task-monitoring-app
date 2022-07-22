import { IUser } from 'common/modules/models/User'
export type { IUser } from 'common/modules/models/User'

export interface BaseQuery {
  success: boolean
  data: IUser
}

export interface AllUsersQuery {
  success: boolean
  data: IUser[]
}
