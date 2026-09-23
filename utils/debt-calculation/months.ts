export interface IYearMonth {
  year: number
  /** Номер місяця, 1–12 (НЕ як у `Date#getMonth`). */
  month: number
}

export const isLeapYear = (year: number): boolean =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0

/**
 * Дільник для 3% річних. Акт рахує кожен місяць за календарем СВОГО року,
 * тому високосний 2024-й ділиться на 366, а сусідні роки — на 365.
 */
export const daysInYear = (year: number): number =>
  isLeapYear(year) ? 366 : 365

/** Кількість календарних днів у місяці (`month` — 1–12). */
export const daysInMonth = (year: number, month: number): number =>
  new Date(year, month, 0).getDate()

const isValidMonth = (value?: IYearMonth): boolean =>
  !!value &&
  Number.isInteger(value.year) &&
  Number.isInteger(value.month) &&
  value.month >= 1 &&
  value.month <= 12

/**
 * Перелік місяців від `from` до `to` включно.
 *
 * Порожній масив, якщо межі не задані, некоректні або `to` раніше за `from` —
 * так форма з недозаповненим періодом не валить розрахунок.
 */
export const buildMonthRange = (
  from?: IYearMonth,
  to?: IYearMonth
): IYearMonth[] => {
  if (!isValidMonth(from) || !isValidMonth(to)) return []

  const months: IYearMonth[] = []
  let { year, month } = from

  while (year < to.year || (year === to.year && month <= to.month)) {
    months.push({ year, month })
    month += 1
    if (month > 12) {
      month = 1
      year += 1
    }
  }

  return months
}

/**
 * Порядковий номер місяця в абсолютній шкалі — щоб порівнювати й сортувати
 * періоди без возні з парами (рік, місяць).
 */
export const periodKey = ({ year, month }: IYearMonth): number =>
  year * 12 + month

/** Чи входить `value` у відрізок [`from`, `to`] включно. */
export const isWithinPeriod = (
  value: IYearMonth,
  from?: IYearMonth,
  to?: IYearMonth
): boolean => {
  const key = periodKey(value)

  if (from && key < periodKey(from)) return false
  if (to && key > periodKey(to)) return false

  return true
}

/** Розбір `YYYY-MM` (query-параметр API). `null` на будь-що інше. */
export const parsePeriod = (value?: string): IYearMonth | null => {
  const match = /^(\d{4})-(\d{1,2})$/.exec(String(value ?? '').trim())
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])

  return month >= 1 && month <= 12 ? { year, month } : null
}

/** Форматування в `YYYY-MM` — зворотне до {@link parsePeriod}. */
export const formatPeriod = ({ year, month }: IYearMonth): string =>
  `${year}-${String(month).padStart(2, '0')}`
