import type { IInflationIndexInput } from '@common/api/inflationIndexApi/inflationIndex.api.types'

export interface IIndexSource {
  name: string
  items: IInflationIndexInput[]
}

export interface ISourceValue {
  source: string
  value: number
}

export interface IIndexMismatch {
  year: number
  month: number
  reason: 'conflict' | 'unconfirmed'
  values: ISourceValue[]
}

export interface IIndexRejected {
  year: number
  month: number
  value: number
}
