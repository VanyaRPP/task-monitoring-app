import type { IInflationIndex as IInflationIndexModel } from '@modules/models/InflationIndex'

export interface IInflationIndex extends IInflationIndexModel {
  domainOverride?: boolean
}

/** Range bounds in `YYYY-MM` form. Both optional. */
export interface IInflationIndexRange {
  from?: string
  to?: string
  domainId?: string
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
export interface IDomainIndexMonth {
  year: number
  month: number
  reference: number | null
  override: {
    value: number
    updatedBy?: string
    updatedAt?: string
  } | null
  value: number | null
}

export interface IDomainIndexesResponse {
  success: boolean
  data: {
    canEdit: boolean
    months: IDomainIndexMonth[]
  }
}

export interface IDomainOverrideRequest {
  domainId: string
  year: number
  month: number
}

export interface ISetDomainOverrideRequest extends IDomainOverrideRequest {
  value: number
}
