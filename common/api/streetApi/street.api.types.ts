import { IStreet } from '@modules/models/Street'
export type { IStreet } from '@modules/models/Street'

export interface AllStreetsQuery {
  success: boolean
  data: IStreet[]
}

export interface BaseQuery {
  success: boolean
  data: IStreet
}
