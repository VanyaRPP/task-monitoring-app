import { expect } from '@jest/globals'
import { getTableScrollX } from '@utils/getTableScrollX'

describe('getTableScrollX', () => {
  it('returns 0 for no columns', () => {
    expect(getTableScrollX([])).toBe(0)
    expect(getTableScrollX(undefined)).toBe(0)
    expect(getTableScrollX(null)).toBe(0)
  })

  it('sums the widths of visible columns', () => {
    const columns = [{ width: 100 }, { width: 200 }, { width: 50 }]
    expect(getTableScrollX(columns)).toBe(350)
  })

  it('ignores columns without a width', () => {
    const columns = [{ width: 100 }, {}, { width: 50 }]
    expect(getTableScrollX(columns)).toBe(150)
  })

  it('excludes hidden columns from the sum', () => {
    const columns = [{ width: 100 }, { width: 200, hidden: true }]
    expect(getTableScrollX(columns)).toBe(100)
  })

  it('sums leaf widths of grouped (children) columns instead of the parent width', () => {
    const columns = [
      { width: 999, children: [{ width: 130 }, { width: 130 }] },
      { width: 150 },
    ]
    expect(getTableScrollX(columns)).toBe(410)
  })

  it('excludes hidden children from the grouped sum', () => {
    const columns = [
      {
        children: [{ width: 130 }, { width: 130, hidden: true }],
      },
    ]
    expect(getTableScrollX(columns)).toBe(130)
  })

  it('adds extraWidth on top of the column sum', () => {
    const columns = [{ width: 100 }]
    expect(getTableScrollX(columns, 28)).toBe(128)
  })

  it('returns just extraWidth when there are no columns', () => {
    expect(getTableScrollX([], 28)).toBe(28)
  })

  it('stays the same when unrelated filters change but the same columns remain visible', () => {
    const buildColumns = () => [
      { width: 170 },
      { width: 140 },
      { width: 170 },
      { children: [{ width: 130 }, { width: 130 }] },
      { width: 164 },
      { width: 48 },
    ]

    const beforeFilter = getTableScrollX(buildColumns())
    const afterFilter = getTableScrollX(buildColumns())

    expect(afterFilter).toBe(beforeFilter)
  })
})
