import {
  buildDebtCalculationInput,
  IApartmentDefaults,
  IApartmentOverrides,
} from './build-input'
import { calculateDebt } from './calculate'
import { IYearMonth, periodKey, yearMonthOf } from './months'
import { buildMonthPrefill, IPrefillPayment, IPrefillService } from './prefill'
import { IDebtCalculationSnapshot } from './serialize'
import {
  DEFAULT_ANNUAL_RATE_PERCENT,
  IDebtCalculationResult,
  InflationMethod,
} from './types'

export const PREFILL_PAYMENTS_LIMIT = 5000
export const PREFILL_SERVICES_LIMIT = 500

export interface IDebtPeriod {
  from: IYearMonth
  to: IYearMonth
}

const shiftMonth = (value: IYearMonth, offset: number): IYearMonth => {
  const index = periodKey(value) - 1 + offset

  return { year: Math.floor(index / 12), month: (index % 12) + 1 }
}

export const defaultDebtPeriod = (
  now: Date = new Date(),
  timeZone?: string
): IDebtPeriod => {
  const current = yearMonthOf(now, timeZone)

  return { from: shiftMonth(current, -12), to: shiftMonth(current, -1) }
}

export interface IDebtSettings {
  overrides: IApartmentOverrides
  annualRatePercent: number
  inflationMethod: InflationMethod
  periodFrom?: IYearMonth
  periodTo?: IYearMonth
}

export const resolveSnapshotSettings = (
  snapshot: IDebtCalculationSnapshot | null | undefined,
  companyId: string
): IDebtSettings => ({
  overrides: snapshot?.overrides?.[companyId] ?? {},
  annualRatePercent: snapshot?.annualRatePercent ?? DEFAULT_ANNUAL_RATE_PERCENT,
  inflationMethod: snapshot?.inflationMethod ?? 'balance',
  periodFrom: snapshot?.periodFrom,
  periodTo: snapshot?.periodTo,
})

export interface ICompanyDebtArgs {
  companyId: string
  company?: IApartmentDefaults | null
  payments?: IPrefillPayment[]
  services?: IPrefillService[]
  indexByPeriod?: Record<string, number>
  saved?: IDebtCalculationSnapshot | null
  defaultPeriod: IDebtPeriod
  timeZone?: string
}

export interface ICompanyDebt {
  result: IDebtCalculationResult
  period: IDebtPeriod
  inflationMethod: InflationMethod
}

export const calculateCompanyDebt = ({
  companyId,
  company,
  payments = [],
  services = [],
  indexByPeriod = {},
  saved,
  defaultPeriod,
  timeZone,
}: ICompanyDebtArgs): ICompanyDebt => {
  const settings = resolveSnapshotSettings(saved, companyId)
  const period = {
    from: settings.periodFrom ?? defaultPeriod.from,
    to: settings.periodTo ?? defaultPeriod.to,
  }

  const result = calculateDebt(
    buildDebtCalculationInput({
      company,
      from: period.from,
      to: period.to,
      indexByPeriod,
      overrides: settings.overrides,
      prefillMonths: buildMonthPrefill({
        companyId,
        payments,
        services,
        timeZone,
      }),
      annualRatePercent: settings.annualRatePercent,
      inflationMethod: settings.inflationMethod,
    })
  )

  return { result, period, inflationMethod: settings.inflationMethod }
}
