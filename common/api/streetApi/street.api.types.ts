import { IStreet } from '@modules/models/Street'
export type { IStreet } from '@modules/models/Street'

export interface AllStreetsQuery {
	totalCount: number
	success: boolean
	data: IStreet[]
}

export interface BaseQuery {
	totalCount: number
	success: boolean
	data: IStreet
}
