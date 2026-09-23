import { cascaderMonths } from '@utils/constants'

/** Гроші в таблиці — завжди дві копійки, щоб колонка не «стрибала». */
export const formatMoney = (value?: number): string =>
  Number.isFinite(value) ? (value as number).toFixed(2) : '—'

/** Сукупний коефіцієнт індексації — чотири знаки, як в Акті. */
export const formatCoefficient = (value?: number): string =>
  Number.isFinite(value) ? (value as number).toFixed(4) : '—'

/** `2021, 11` → `Листопад 2021`. */
export const formatMonthLabel = (year: number, month: number): string =>
  `${cascaderMonths[month - 1]?.label ?? month} ${year}`
