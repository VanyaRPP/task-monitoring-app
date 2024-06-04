import { IStreet } from '@common/modules/models/Street'
export type { IStreet } from 'common/modules/models/Street'

export type BaseGetQueryRequest = {
  limit?: number
  skip?: number
}

export type GetStreetsQueryRequest =
  | (BaseGetQueryRequest & {
      id?: string[] | string
      domainId?: string[] | string
      city?: string[] | string
      address?: string[] | string
    })
  | undefined
export type GetStreetsQueryResponse = {
  data: IStreet[]
  filter: { city: any[]; address: any[] }
  total: number
}
