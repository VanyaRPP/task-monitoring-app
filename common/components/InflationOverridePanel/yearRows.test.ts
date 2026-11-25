import { expect } from '@jest/globals'
import { buildYearRows } from './yearRows'

const year = (value: number, months: number[]) =>
  months.map((index, i) => ({ year: value, month: i + 1, value: index }))

// Derzhstat's published months; the yearly figures are 108.0 and 110.3.
const Y2025 = year(
  2025,
  [
    101.2, 100.8, 101.5, 100.7, 101.3, 100.8, 99.8, 99.8, 100.3, 100.9, 100.4,
    100.2,
  ]
)
const Y2026 = year(
  2026,
  [100.7, 101.0, 101.7, 101.4, 100.9, 99.9, 100.3, 100.1, 102.1, 101.8]
)

describe('buildYearRows', () => {
  it('compounds a full year into the official yearly index', () => {
    const [row] = buildYearRows(Y2025)

    expect(row.total).toBe(108)
    expect(row.isComplete).toBe(true)
  })

  it('compounds an unfinished year up to its latest month', () => {
    const [row] = buildYearRows(Y2026)

    expect(row.total).toBe(110.3)
    expect(row.isComplete).toBe(false)
    expect(row.months.slice(9)).toEqual([101.8, null, null])
  })

  it('gives no total when a month before the latest one is missing', () => {
    const [row] = buildYearRows(Y2025.filter(({ month }) => month !== 5))

    expect(row.total).toBeNull()
    expect(row.isComplete).toBe(false)
  })

  it('lists the years oldest first, whatever the input order', () => {
    const rows = buildYearRows([...Y2026, ...Y2025])

    expect(rows.map((row) => row.year)).toEqual([2025, 2026])
  })
})
