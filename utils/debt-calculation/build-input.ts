import { IInflationIndex } from '@modules/models/InflationIndex'
import { buildMonthRange, formatPeriod, IYearMonth } from './months'
import {
  DEFAULT_ANNUAL_RATE_PERCENT,
  IDebtCalculationInput,
  IDebtMonthInput,
  InflationMethod,
} from './types'

/** Ручна правка одного місяця. Порожнє поле = беремо значення за замовчуванням. */
export interface IMonthOverride {
  area?: number
  tariff?: number
  charged?: number
  paid?: number
  inflationIndex?: number
}

/** Ручні правки по одній квартирі; ключ у `months` — `YYYY-MM`. */
export interface IApartmentOverrides {
  area?: number
  tariff?: number
  openingDebt?: number
  legalFees?: number
  courtFee?: number
  months?: Record<string, IMonthOverride>
}

/** Мінімум, який потрібен від компанії — щоб не тягнути весь IRealestate. */
export interface IApartmentDefaults {
  totalArea?: number
  pricePerMeter?: number
}

export interface IBuildDebtInputArgs {
  company?: IApartmentDefaults | null
  from?: IYearMonth
  to?: IYearMonth
  /** Довідник ІСЦ, згорнутий у `{ 'YYYY-MM': 100.8 }`. */
  indexByPeriod?: Record<string, number>
  overrides?: IApartmentOverrides
  /**
   * Підтягнуте з БД по місяцях (ключ — `YYYY-MM`). Стоїть НИЖЧЕ за будь-яку
   * ручну правку: користувач завжди головніший за базу.
   */
  prefillMonths?: Record<string, IMonthOverride>
  annualRatePercent?: number
  inflationMethod?: InflationMethod
}

/** Згортає відповідь довідника в мапу за періодом. */
export const indexesByPeriod = (
  indexes: Pick<IInflationIndex, 'year' | 'month' | 'value'>[] = []
): Record<string, number> =>
  indexes.reduce<Record<string, number>>((acc, { year, month, value }) => {
    acc[formatPeriod({ year, month })] = value
    return acc
  }, {})

/**
 * Збирає вхід для {@link calculateDebt} з того, що є на сторінці.
 *
 * Пріоритет значень — від найконкретнішого до найзагальнішого:
 * правка місяця → правка квартири → префіл з БД → дані компанії.
 *
 * `charged` свідомо не має дефолту: поки його не ввели руками, двигун рахує
 * `площа × тариф` сам, і правка площі чи тарифу одразу видно в сумі.
 */
export const buildDebtCalculationInput = ({
  company,
  from,
  to,
  indexByPeriod = {},
  overrides = {},
  prefillMonths = {},
  annualRatePercent = DEFAULT_ANNUAL_RATE_PERCENT,
  inflationMethod = 'balance',
}: IBuildDebtInputArgs): IDebtCalculationInput => {
  const months: IDebtMonthInput[] = buildMonthRange(from, to).map(
    (yearMonth) => {
      const period = formatPeriod(yearMonth)
      const month = overrides.months?.[period] ?? {}
      const prefill = prefillMonths[period] ?? {}

      return {
        ...yearMonth,
        area:
          month.area ??
          overrides.area ??
          prefill.area ??
          company?.totalArea ??
          0,
        tariff:
          month.tariff ??
          overrides.tariff ??
          prefill.tariff ??
          company?.pricePerMeter ??
          0,
        charged: month.charged ?? prefill.charged,
        paid: month.paid ?? prefill.paid ?? 0,
        inflationIndex:
          month.inflationIndex ??
          prefill.inflationIndex ??
          indexByPeriod[period],
      }
    }
  )

  return {
    months,
    openingDebt: overrides.openingDebt ?? 0,
    annualRatePercent,
    inflationMethod,
    legalFees: overrides.legalFees ?? 0,
    courtFee: overrides.courtFee ?? 0,
  }
}
