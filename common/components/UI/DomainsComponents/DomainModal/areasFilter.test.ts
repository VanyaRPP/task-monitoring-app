import {
  CompanyAreaRow,
  filterChangedCompaniesAreas,
  isCompanyAreaChanged,
} from './areasFilter'

const row = (overrides: Partial<CompanyAreaRow> = {}): CompanyAreaRow => ({
  _id: 'r1',
  name: 'Acme',
  area: 100,
  rentPart: 25,
  _initialArea: 100,
  _initialRentPart: 25,
  ...overrides,
})

describe('isCompanyAreaChanged', () => {
  it('returns false when both area and rentPart equal their initial values', () => {
    expect(isCompanyAreaChanged(row())).toBe(false)
  })

  it('returns true when area diverges from _initialArea', () => {
    expect(isCompanyAreaChanged(row({ area: 150 }))).toBe(true)
  })

  it('returns true when rentPart diverges from _initialRentPart', () => {
    expect(isCompanyAreaChanged(row({ rentPart: 40 }))).toBe(true)
  })

  it('treats numeric/string mismatches consistently (e.g. "100" === 100)', () => {
    expect(
      isCompanyAreaChanged(row({ area: '100' as any, _initialArea: 100 }))
    ).toBe(false)
  })

  it('returns false when row has no _initial fields (treated as unchanged)', () => {
    expect(
      isCompanyAreaChanged({
        _id: 'r1',
        area: 100,
        rentPart: 25,
      })
    ).toBe(false)
  })
})

describe('filterChangedCompaniesAreas', () => {
  it('returns [] for null/undefined/non-array input', () => {
    expect(filterChangedCompaniesAreas(null)).toEqual([])
    expect(filterChangedCompaniesAreas(undefined)).toEqual([])
    expect(filterChangedCompaniesAreas('not an array' as any)).toEqual([])
  })

  it('returns [] when nothing changed (rename-only case)', () => {
    expect(filterChangedCompaniesAreas([row(), row({ _id: 'r2' })])).toEqual([])
  })

  it('returns only the changed rows when one of many is edited', () => {
    const a = row({ _id: 'a' })
    const b = row({ _id: 'b', area: 200 }) // changed area
    const c = row({ _id: 'c' })
    const result = filterChangedCompaniesAreas([a, b, c])
    expect(result).toEqual([b])
  })

  it('skips rows without _id even if values changed', () => {
    expect(
      filterChangedCompaniesAreas([row({ _id: undefined, area: 999 })])
    ).toEqual([])
  })

  it('skips rows that have no _initial fields (would-be regression of old behavior)', () => {
    expect(
      filterChangedCompaniesAreas([
        { _id: 'r1', area: 100, rentPart: 25 },
        { _id: 'r2', area: 200, rentPart: 50 },
      ])
    ).toEqual([])
  })
})
