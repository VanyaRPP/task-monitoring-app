import { IInflationIndex } from '@modules/models/InflationIndex'

export type { IInflationIndex }

/** Range bounds in `YYYY-MM` form. Both optional. */
export interface IInflationIndexRange {
  from?: string
  to?: string
}

export interface IInflationIndexInput {
  year: number
  month: number
  value: number
}

export interface IInflationIndexResponse {
  success: boolean
  data: IInflationIndex[]
}
