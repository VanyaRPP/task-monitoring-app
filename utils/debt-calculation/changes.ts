import { formatPeriod, IYearMonth } from './months'

/**
 * Changes of a company-wide value over the period: the tariff went up in
 * 02.2019, the owner paid 300 a month from 2021 on. Each value holds from its
 * month until the next change; before the first one the field's own value
 * (the one typed above the table) applies. Three tariff rises in seven years
 * are three entries, not 84 month edits.
 */

export const CHANGE_FIELDS = [
  'area',
  'tariff',
  'charged',
  'paid',
  'correction',
] as const

export type ChangeField = (typeof CHANGE_FIELDS)[number]

export interface IValueChange {
  /** `YYYY-MM`: the first month the value holds for. */
  from: string
  value: number
}

export type IValueChanges = Partial<Record<ChangeField, IValueChange[]>>

/** By month, one per month: a later entry for the same month replaces it. */
export const normalizeChanges = (changes: IValueChange[]): IValueChange[] => {
  const byMonth = new Map<string, number>()
  for (const { from, value } of changes) byMonth.set(from, value)
  return [...byMonth.entries()]
    .map(([from, value]) => ({ from, value }))
    .sort((a, b) => a.from.localeCompare(b.from))
}

/** The value in force in `period` (`YYYY-MM`), or `base` before any change. */
export const valueInMonth = (
  changes: IValueChange[] | undefined,
  base: number | undefined,
  period: string
): number | undefined => {
  let current = base
  for (const change of changes ?? []) {
    if (change.from <= period) current = change.value
  }
  return current
}

export interface IValueRun extends Pick<IValueChange, 'value'> {
  from: IYearMonth
  to: IYearMonth
}

/**
 * Consecutive months with the same value, merged: what the printout lists so
 * a court sees which tariff stood when. Reads the months as calculated, so it
 * covers values from the invoices too, not only the typed changes.
 */
export const valueRuns = <T extends IYearMonth>(
  months: T[],
  pick: (month: T) => number
): IValueRun[] =>
  months.reduce<IValueRun[]>((runs, month) => {
    const value = pick(month)
    const last = runs[runs.length - 1]
    if (last && last.value === value) {
      last.to = { year: month.year, month: month.month }
    } else {
      const at = { year: month.year, month: month.month }
      runs.push({ value, from: at, to: at })
    }
    return runs
  }, [])

/** The fields whose value changes in `period` - to mark that month. */
export const changesInMonth = (
  changes: IValueChanges | undefined,
  period: IYearMonth | string
): { field: ChangeField; value: number }[] => {
  const key = typeof period === 'string' ? period : formatPeriod(period)
  return CHANGE_FIELDS.flatMap((field) =>
    (changes?.[field] ?? [])
      .filter(({ from }) => from === key)
      .map(({ value }) => ({ field, value }))
  )
}
