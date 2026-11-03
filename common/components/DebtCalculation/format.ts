import { cascaderMonths } from '@utils/constants'

/** Money always carries two decimals so the column does not jitter. */
export const formatMoney = (value?: number): string =>
  Number.isFinite(value) ? (value as number).toFixed(2) : '—'

/** The cumulative indexation coefficient - four decimals, as in the Act. */
export const formatCoefficient = (value?: number): string =>
  Number.isFinite(value) ? (value as number).toFixed(4) : '—'

/** `2021, 11` → `Листопад 2021`. */
export const formatMonthLabel = (year: number, month: number): string =>
  `${cascaderMonths[month - 1]?.label ?? month} ${year}`
