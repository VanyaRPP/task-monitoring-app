import { IStreet } from '@common/modules/models/Street'
export type { IStreet } from 'common/modules/models/Street'

export interface AllStreetsQuery {
  success: boolean
  data: IStreet[]
  total: number
}

export interface BaseQuery {
  success: boolean
  data: IStreet
}
