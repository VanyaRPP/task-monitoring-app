import { IInflationIndex } from '@modules/models/InflationIndex'

export type { IInflationIndex }

/** Межі вибірки у форматі `YYYY-MM`. Обидві опційні. */
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
