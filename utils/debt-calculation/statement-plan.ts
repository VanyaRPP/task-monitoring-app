import { Operations } from '@utils/constants'
import { formatPeriod, IYearMonth, parsePeriod, periodKey } from './months'
import {
  housingFeeCharged,
  IPrefillPayment,
  isHousingFeeLine,
  isOpeningBalanceLine,
  periodOfDate,
} from './prefill'
import { IStatementImport, IStatementMonth } from './statement'

/**
 * What a statement import would do to a company's payments, month by month.
 *
 * Pure: the caller loads the company's payments, this decides. The same plan
 * is shown in the chat card and recomputed on save, so the server never acts
 * on the browser's idea of what is in the DB.
 */

export interface IExistingPayment extends IPrefillPayment {
  _id: string
}

export type MonthStatus = 'new' | 'same' | 'conflict'

export interface IMonthAmounts {
  /** Housing fee net of corrections. */
  charged: number
  paid: number
}

export interface IMonthPlan extends IYearMonth {
  period: string
  /** What the import brings: the statement's month. */
  incoming: IMonthAmounts
  /** What the system already holds for the month; `null` when nothing. */
  system: IMonthAmounts | null
  status: MonthStatus
  /**
   * The import can replace the system's records for this month without taking
   * anything else with them. False when the month also holds invoices for
   * other services - deleting those to make room is never an option.
   */
  replaceable: boolean
  /** The records an «import» choice deletes. */
  replaceIds: string[]
}

/**
 * - `new`: the company has no «Вхідне сальдо» yet - one is created.
 * - `same` / `conflict`: one already sits in that very month.
 * - `covered`: the company's history already starts earlier; a second opening
 *   balance would count the same debt twice, so none is created.
 */
export type OpeningStatus = 'new' | 'same' | 'conflict' | 'covered'

export interface IOpeningPlan extends IYearMonth {
  period: string
  amount: number
  status: OpeningStatus
  /** The system's figure for the same moment, when it has one. */
  system: number | null
  replaceIds: string[]
}

/**
 * A later «Вхідне сальдо» that the imported months now explain. Left in
 * place it would count that debt twice, so it is always removed.
 */
export interface ISupersededOpening {
  id: string
  period: string
  amount: number
  /** The debt the import itself arrives at by that month. */
  expected: number
}

export interface IStatementImportPlan {
  months: IMonthPlan[]
  opening: IOpeningPlan | null
  superseded: ISupersededOpening[]
  warnings: string[]
}

export type Resolution = 'import' | 'system'

export interface IStatementImportResult {
  /** The payment-audit batch the whole import is logged under. */
  batchId: string
  createdIds: string[]
  deletedIds: string[]
  created: { debits: number; credits: number; opening: boolean }
}

/** Resolution key of the opening balance, next to the `YYYY-MM` month keys. */
export const OPENING_RESOLUTION_KEY = 'opening'

const TOLERANCE = 0.005

const round2 = (value: number): number => Math.round(value * 100) / 100

const same = (a: number, b: number): boolean => Math.abs(a - b) <= TOLERANCE

const money = (value: number): string => value.toFixed(2)

const debitPeriod = (payment: IExistingPayment): string | undefined => {
  const monthService = payment.monthService
  const serviceDate =
    typeof monthService === 'string' ? undefined : monthService?.date

  return periodOfDate(serviceDate ?? payment.invoiceCreationDate)
}

const creditPeriod = (payment: IExistingPayment): string | undefined =>
  periodOfDate(payment.paidAt ?? payment.invoiceCreationDate)

const openingAmount = (payment: IExistingPayment): number =>
  round2(
    (payment.invoice ?? [])
      .filter(isOpeningBalanceLine)
      .reduce((acc, { sum }) => acc + (Number(sum) || 0), 0)
  )

const hasOtherServices = (payment: IExistingPayment): boolean =>
  (payment.invoice ?? []).some(
    (line) => !isHousingFeeLine(line) && !isOpeningBalanceLine(line)
  )

interface IMonthRecords {
  housing: IExistingPayment[]
  other: IExistingPayment[]
  credits: IExistingPayment[]
}

const indexByMonth = (
  payments: IExistingPayment[]
): Map<string, IMonthRecords> => {
  const byMonth = new Map<string, IMonthRecords>()
  const at = (period: string): IMonthRecords => {
    if (!byMonth.has(period)) {
      byMonth.set(period, { housing: [], other: [], credits: [] })
    }
    return byMonth.get(period)
  }

  for (const payment of payments) {
    if (payment.type === Operations.Credit) {
      const period = creditPeriod(payment)
      if (period) at(period).credits.push(payment)
      continue
    }
    if (payment.type !== Operations.Debit) continue

    const period = debitPeriod(payment)
    if (!period) continue

    if (hasOtherServices(payment)) {
      at(period).other.push(payment)
    } else if (housingFeeCharged(payment) != null) {
      at(period).housing.push(payment)
    }
  }

  return byMonth
}

const systemAmounts = (records?: IMonthRecords): IMonthAmounts | null => {
  if (!records) return null

  // A mixed invoice still carries housing-fee lines worth comparing.
  const debits = [...records.housing, ...records.other].filter(
    (payment) => housingFeeCharged(payment) != null
  )
  if (debits.length === 0 && records.credits.length === 0) return null

  return {
    charged: round2(
      debits.reduce((acc, payment) => acc + housingFeeCharged(payment), 0)
    ),
    paid: round2(
      records.credits.reduce(
        (acc, payment) => acc + (Number(payment.generalSum) || 0),
        0
      )
    ),
  }
}

const planMonth = (
  month: IStatementMonth,
  records?: IMonthRecords
): IMonthPlan => {
  const period = formatPeriod(month)
  const incoming = {
    charged: round2(month.charged + month.correction),
    paid: round2(month.paid),
  }
  const system = systemAmounts(records)

  const status: MonthStatus = !system
    ? 'new'
    : same(system.charged, incoming.charged) && same(system.paid, incoming.paid)
      ? 'same'
      : 'conflict'

  return {
    year: month.year,
    month: month.month,
    period,
    incoming,
    system,
    status,
    replaceable: !records || records.other.length === 0,
    replaceIds: records
      ? [...records.housing, ...records.credits].map(({ _id }) => String(_id))
      : [],
  }
}

export const planStatementImport = (
  statement: IStatementImport,
  payments: IExistingPayment[]
): IStatementImportPlan => {
  const byMonth = indexByMonth(payments)
  const months = statement.months.map((month) =>
    planMonth(month, byMonth.get(formatPeriod(month)))
  )
  const warnings: string[] = []

  const openings = payments
    .filter(
      (payment) =>
        payment.type === Operations.Debit &&
        (payment.invoice ?? []).some(isOpeningBalanceLine)
    )
    .map((payment) => ({
      id: String(payment._id),
      period: debitPeriod(payment),
      amount: openingAmount(payment),
    }))
    .filter(
      (entry): entry is { id: string; period: string; amount: number } =>
        !!entry.period
    )

  const brought = statement.openingBalance
  let opening: IOpeningPlan | null = null
  const superseded: ISupersededOpening[] = []

  if (brought) {
    const period = formatPeriod(brought)
    const start = periodKey(brought)
    const keyOf = (value: string): number => periodKey(parsePeriod(value))

    const earlier = openings.filter(({ period: p }) => keyOf(p) < start)
    const atStart = openings.filter(({ period: p }) => p === period)

    if (earlier.length > 0) {
      // The system's own balance at the import's start: its earliest opening
      // balance carried forward through its months.
      const historyStart = Math.min(...earlier.map(({ period: p }) => keyOf(p)))
      let system = earlier.reduce((acc, { amount }) => acc + amount, 0)
      byMonth.forEach((records, p) => {
        const key = keyOf(p)
        if (key < historyStart || key >= start) return
        const amounts = systemAmounts(records)
        if (amounts) system += amounts.charged - amounts.paid
      })
      system = round2(system)

      opening = {
        ...brought,
        period,
        amount: brought.amount,
        status: 'covered',
        system,
        replaceIds: [],
      }
      if (!same(system, brought.amount)) {
        warnings.push(
          `Борг на початок ${period} у розрахунку — ${money(brought.amount)}, а в системі на цей момент ${money(system)}. Нове вхідне сальдо не створюється: історія компанії вже починається раніше.`
        )
      }
    } else {
      const system = atStart.length
        ? round2(atStart.reduce((acc, { amount }) => acc + amount, 0))
        : null
      opening = {
        ...brought,
        period,
        amount: brought.amount,
        status:
          system === null
            ? 'new'
            : same(system, brought.amount)
              ? 'same'
              : 'conflict',
        system,
        replaceIds: atStart.map(({ id }) => id),
      }
    }

    // Later opening balances that the imported months now lead up to.
    const sorted = [...statement.months].sort(
      (a, b) => periodKey(a) - periodKey(b)
    )
    const last = sorted[sorted.length - 1]
    const reach = last ? periodKey(last) + 1 : start

    for (const entry of openings) {
      const key = keyOf(entry.period)
      if (key <= start || key > reach) continue

      const expected = round2(
        sorted
          .filter((month) => periodKey(month) < key)
          .reduce(
            (acc, month) => acc + month.charged + month.correction - month.paid,
            brought.amount
          )
      )
      superseded.push({ ...entry, expected })
      if (!same(expected, entry.amount)) {
        warnings.push(
          `Вхідне сальдо ${entry.period} у системі — ${money(entry.amount)}, а за розрахунком на той момент ${money(expected)}. Його буде прибрано: імпортовані місяці вже пояснюють цей борг.`
        )
      }
    }
  }

  return { months, opening, superseded, warnings }
}

export interface IResolvedImport {
  months: IStatementMonth[]
  createOpening: boolean
  deleteIds: string[]
}

/**
 * Turns the plan and the user's choices into writes. A conflict nobody chose
 * for stays with the system - silence never deletes anything.
 */
export const resolveStatementImport = (
  statement: IStatementImport,
  plan: IStatementImportPlan,
  resolutions: Record<string, Resolution> = {}
): IResolvedImport => {
  const taken = new Set(
    plan.months
      .filter(
        ({ status, replaceable, period }) =>
          status === 'new' ||
          (status === 'conflict' &&
            replaceable &&
            resolutions[period] === 'import')
      )
      .map(({ period }) => period)
  )

  const deleteIds = plan.months
    .filter(({ status, period }) => status === 'conflict' && taken.has(period))
    .flatMap(({ replaceIds }) => replaceIds)

  const openingTaken =
    plan.opening?.status === 'new' ||
    (plan.opening?.status === 'conflict' &&
      resolutions[OPENING_RESOLUTION_KEY] === 'import')

  if (plan.opening?.status === 'conflict' && openingTaken) {
    deleteIds.push(...plan.opening.replaceIds)
  }
  deleteIds.push(...plan.superseded.map(({ id }) => id))

  return {
    months: statement.months.filter((month) => taken.has(formatPeriod(month))),
    createOpening: openingTaken,
    deleteIds: [...new Set(deleteIds)],
  }
}

/** A century of months - the same bound the calculation snapshot keeps. */
export const MAX_IMPORT_MONTHS = 1200

const finite = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === '') return undefined
  const num = Number(value)
  return Number.isFinite(num) ? num : undefined
}

const yearMonthOf = (raw: any): IYearMonth | null => {
  const year = finite(raw?.year)
  const month = finite(raw?.month)

  return Number.isInteger(year) &&
    Number.isInteger(month) &&
    year >= 1990 &&
    year <= 2100 &&
    month >= 1 &&
    month <= 12
    ? { year, month }
    : null
}

/**
 * The statement as the browser sent it, or `null` when anything is off.
 * All-or-nothing: one bad month means the client sent something the user was
 * not shown, and a partial import is worse than none.
 */
export const sanitizeStatementImport = (
  raw: unknown
): IStatementImport | null => {
  const source = raw as any
  if (!Array.isArray(source?.months)) return null
  if (source.months.length === 0 || source.months.length > MAX_IMPORT_MONTHS) {
    return null
  }

  const seen = new Set<number>()
  const months: IStatementMonth[] = []
  for (const entry of source.months) {
    const yearMonth = yearMonthOf(entry)
    const charged = finite(entry?.charged)
    const correction = finite(entry?.correction)
    const paid = finite(entry?.paid)
    if (
      !yearMonth ||
      charged === undefined ||
      correction === undefined ||
      paid === undefined ||
      seen.has(periodKey(yearMonth))
    ) {
      return null
    }
    seen.add(periodKey(yearMonth))
    months.push({ ...yearMonth, charged, correction, paid })
  }

  let openingBalance: IStatementImport['openingBalance'] = null
  if (source.openingBalance) {
    const yearMonth = yearMonthOf(source.openingBalance)
    const amount = finite(source.openingBalance.amount)
    if (!yearMonth || amount === undefined) return null
    openingBalance = { ...yearMonth, amount }
  }

  return {
    openingBalance,
    months: months.sort((a, b) => periodKey(a) - periodKey(b)),
  }
}

/** Only known keys and values pass; anything else stays with the system. */
export const sanitizeResolutions = (
  raw: unknown
): Record<string, Resolution> => {
  if (!raw || typeof raw !== 'object') return {}

  const out: Record<string, Resolution> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (
      (key === OPENING_RESOLUTION_KEY || parsePeriod(key)) &&
      (value === 'import' || value === 'system')
    ) {
      out[key] = value
    }
  }
  return out
}
