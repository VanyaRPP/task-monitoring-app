import type { CompanyAreaRow } from '../areasFilter'

export interface AreaCalcRow extends CompanyAreaRow {
  _excluded?: boolean
  _pinned?: boolean
}

export type CompanyState = 'normal' | 'pinned' | 'excluded'

export interface CompanyAreaSource {
  _id?: string
  companyName?: string
  totalArea?: number
}

export interface ActualAreaSources {
  realEstates?: CompanyAreaSource[]
  companies?: CompanyAreaSource[]
}

const toNumber = (value: unknown): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const hasArea = (source: CompanyAreaSource): boolean =>
  source.totalArea !== undefined && source.totalArea !== null

const matches = (source: CompanyAreaSource, row: CompanyAreaRow): boolean =>
  (!!row._id && !!source._id && source._id === row._id) ||
  (!!row.name && source.companyName === row.name)

export const resolveActualArea = (
  row: CompanyAreaRow,
  { realEstates, companies }: ActualAreaSources
): number => {
  const fromRealEstate = realEstates?.find(
    (item) => matches(item, row) && hasArea(item)
  )
  if (fromRealEstate) return toNumber(fromRealEstate.totalArea)

  const fromCompanies = companies?.find(
    (item) => matches(item, row) && hasArea(item)
  )
  if (fromCompanies) return toNumber(fromCompanies.totalArea)

  return toNumber(row.area)
}

export const isRowExcluded = (row: AreaCalcRow): boolean =>
  row?._excluded === true

export const isRowPinned = (row: AreaCalcRow): boolean => row?._pinned === true

export const getCompanyState = (row: AreaCalcRow): CompanyState => {
  if (isRowExcluded(row)) return 'excluded'
  if (isRowPinned(row)) return 'pinned'
  return 'normal'
}

export const getActiveRows = (
  rows: AreaCalcRow[] | undefined | null
): AreaCalcRow[] =>
  Array.isArray(rows) ? rows.filter((r) => !isRowExcluded(r)) : []

export const getTotalArea = (rows: CompanyAreaRow[]): number =>
  (rows || []).reduce((acc, row) => acc + toNumber(row.area), 0)

export const getTotalRentPart = (rows: CompanyAreaRow[]): number =>
  (rows || []).reduce((acc, row) => acc + toNumber(row.rentPart), 0)

const round2 = (value: number): number => Math.round(value * 100) / 100

export const getRentPart = (area: unknown, totalArea: number): number =>
  totalArea > 0 ? round2((toNumber(area) / totalArea) * 100) : 0

export const redistributeShares = (
  rows: AreaCalcRow[] | undefined | null
): AreaCalcRow[] => {
  if (!Array.isArray(rows)) return []

  const totalArea = getTotalArea(getActiveRows(rows))

  return rows.map((row) =>
    isRowExcluded(row)
      ? row
      : { ...row, rentPart: getRentPart(row.area, totalArea) }
  )
}

export const recalculateAreaShares = (
  rows: AreaCalcRow[] | undefined | null,
  sources: ActualAreaSources = {}
): AreaCalcRow[] => {
  if (!Array.isArray(rows)) return []

  return redistributeShares(
    rows.map((row) =>
      isRowExcluded(row) || isRowPinned(row)
        ? row
        : { ...row, area: resolveActualArea(row, sources) }
    )
  )
}

const patchRow = (
  rows: AreaCalcRow[] | undefined | null,
  index: number,
  patch: (row: AreaCalcRow) => AreaCalcRow
): AreaCalcRow[] => {
  if (!Array.isArray(rows)) return []
  return rows.map((row, i) => (i === index ? patch(row) : row))
}

export const excludeCompany = (
  rows: AreaCalcRow[] | undefined | null,
  index: number
): AreaCalcRow[] =>
  redistributeShares(
    patchRow(rows, index, (row) => ({ ...row, _excluded: true }))
  )

export const includeCompany = (
  rows: AreaCalcRow[] | undefined | null,
  index: number
): AreaCalcRow[] =>
  redistributeShares(
    patchRow(rows, index, (row) => ({ ...row, _excluded: false }))
  )

export const pinCompanyArea = (
  rows: AreaCalcRow[] | undefined | null,
  index: number
): AreaCalcRow[] =>
  redistributeShares(
    patchRow(rows, index, (row) => ({ ...row, _pinned: true }))
  )

export const unpinCompanyArea = (
  rows: AreaCalcRow[] | undefined | null,
  index: number,
  sources: ActualAreaSources = {}
): AreaCalcRow[] =>
  redistributeShares(
    patchRow(rows, index, (row) => {
      const released = { ...row, _pinned: false }
      return { ...released, area: resolveActualArea(released, sources) }
    })
  )

export const hasRecalculationChanges = (
  before: AreaCalcRow[],
  after: AreaCalcRow[]
): boolean =>
  after.some(
    (row, i) =>
      toNumber(row.area) !== toNumber(before[i]?.area) ||
      toNumber(row.rentPart) !== toNumber(before[i]?.rentPart)
  )
