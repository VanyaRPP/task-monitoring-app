import type { IInflationIndex } from '@common/api/inflationIndexApi/inflationIndex.api.types'
import Big from 'big.js'

export interface IYearRow {
  year: number
  /** January to December; `null` where the month is not in the directory. */
  months: (number | null)[]
  /**
   * The monthly indexes compounded from January to the latest known month.
   * `null` when one of those months is missing.
   */
  total: number | null
  /** All twelve months are there, so the total is the yearly index. */
  isComplete: boolean
}

// Rounded once, at the end: rounding every step drifts from the official figure.
const compound = (values: number[]): number =>
  Number(
    values
      .reduce((acc, value) => acc.times(value).div(100), new Big(1))
      .times(100)
      .toFixed(1)
  )

/** One row per year, oldest first. */
export const buildYearRows = (indexes: IInflationIndex[]): IYearRow[] => {
  const byYear = new Map<number, (number | null)[]>()

  indexes.forEach(({ year, month, value }) => {
    if (!byYear.has(year)) byYear.set(year, Array(12).fill(null))
    byYear.get(year)[month - 1] = value
  })

  return Array.from(byYear.keys())
    .sort((a, b) => a - b)
    .map((year) => {
      const months = byYear.get(year)
      const last = months.reduce(
        (found, value, i) => (value === null ? found : i),
        -1
      )
      const elapsed = months.slice(0, last + 1)
      const hasGap = elapsed.includes(null)

      return {
        year,
        months,
        total: hasGap ? null : compound(elapsed),
        isComplete: !hasGap && elapsed.length === 12,
      }
    })
}
