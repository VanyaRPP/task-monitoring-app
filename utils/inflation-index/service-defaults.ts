import { ServiceType } from '@utils/constants'

export interface IServicePriceRow {
  fieldName?: string
  price?: number | null
}

const isEmpty = (price?: number | null): boolean => price == null || price === 0

export const applyInflationDefault = <T extends IServicePriceRow>(
  rows: T[],
  value: number | null,
  previousDefault: number | null
): T[] => {
  let changed = false

  const next = rows.map((row) => {
    if (row.fieldName !== ServiceType.Inflicion) return row
    if (!isEmpty(row.price) && row.price !== previousDefault) return row
    if (row.price === value) return row

    changed = true
    return { ...row, price: value }
  })

  return changed ? next : rows
}
