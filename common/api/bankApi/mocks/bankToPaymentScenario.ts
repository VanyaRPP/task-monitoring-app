/**
 * Deterministic "bank invoice → payment → «Платіж є»" scenario.
 *
 * Models the full flow with fixed ids/dates so it can back both manual checks
 * (mock bank page, NEXT_PUBLIC_USE_MOCK_BANK=true) and automated tests:
 *  1. A bank transaction (invoice) shows up on the bank page.
 *  2. It is sent to payments: the saved Payment carries the same transaction
 *     payload the bank page builds (buildTransactionPayload).
 *  3. checkTransaction finds that Payment → isMatchingPayment («Платіж є») and
 *     previousCompanyId point the bank row at the payment's company.
 *  4. The company may be archived afterwards — the link must not break and the
 *     row must show «Архівована» instead of the company id.
 *
 * Use createScenarioPaymentStore() as an in-memory stand-in for the Payment
 * model: it answers exactly the queries checkTransaction runs.
 */
import { ITransaction } from '@components/Pages/BankTransactions/components/TransactionsTable/components/transactionTypes'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { buildTransactionPayload } from '@components/Pages/BankTransactions/components/TransactionsTable/components/quickSendHelpers'
import { parseDate } from '@components/Pages/BankTransactions/components/TransactionsTable/components/datesHelper'
import { Operations } from '@utils/constants'

export const SCENARIO_DOMAIN_ID = '64d0e6440fa634ae54080100'

export const SCENARIO_ACTIVE_COMPANY: IRealestate = {
  _id: '64d0e6440fa634ae54080201',
  companyName: 'ФОП Активний Орендар',
  account: 'UA300000000000000000000000201',
  rnokpp: '3010101010',
  archived: false,
} as IRealestate

// Same shape as the company from the bug report: it already has a payment,
// then gets archived.
export const SCENARIO_ARCHIVED_COMPANY: IRealestate = {
  _id: '64ff47a2a6ce612394047226',
  companyName: 'ФОП Архівний Орендар',
  account: 'UA300000000000000000000000202',
  rnokpp: '3020202020',
  archived: true,
} as IRealestate

const baseTransaction: Omit<
  ITransaction,
  | 'AUT_CNTR_CRF'
  | 'AUT_CNTR_ACC'
  | 'AUT_CNTR_NAM'
  | 'NUM_DOC'
  | 'OSND'
  | 'SUM'
  | 'SUM_E'
  | 'REF'
  | 'ID'
  | 'TECHNICAL_TRANSACTION_ID'
> = {
  AUT_MY_CRF: '0000000000',
  AUT_MY_MFO: '300000',
  AUT_MY_ACC: 'UA300000000000000000000000001',
  AUT_MY_NAM: 'Тест Т. Є. ФОП',
  AUT_MY_MFO_NAME: 'АТ КБ "ПРИВАТБАНК"',
  AUT_MY_MFO_CITY: 'ДНІПРО',
  AUT_CNTR_MFO: '300001',
  AUT_CNTR_MFO_NAME: 'АТ "ТЕСТ БАНК"',
  AUT_CNTR_MFO_CITY: 'КИЇВ',
  CCY: 'UAH',
  FL_REAL: 'r',
  PR_PR: 'r',
  DOC_TYP: 'p',
  DAT_KL: '22.06.2026',
  DAT_OD: '22.06.2026',
  REFN: 'P',
  TIM_P: '12:23',
  DATE_TIME_DAT_OD_TIM_P: '22.06.2026 12:23:00',
  TRANTYPE: 'C',
  DLR: '',
  RECIPIENT_ULTMT_NCEO: '',
  isMatchingPayment: false,
  previousCompanyId: null,
}

// Bank returns the "_online" id; payments store the final REF+REFN+date+time id.
export const SCENARIO_ARCHIVED_TRANSACTION: ITransaction = {
  ...baseTransaction,
  AUT_CNTR_CRF: SCENARIO_ARCHIVED_COMPANY.rnokpp,
  AUT_CNTR_ACC: SCENARIO_ARCHIVED_COMPANY.account,
  AUT_CNTR_NAM: SCENARIO_ARCHIVED_COMPANY.companyName,
  NUM_DOC: '901',
  OSND: 'Оплата згідно рахунку № 901 від 01.06.2026',
  SUM: '12500.00',
  SUM_E: '12500.00',
  REF: 'SCNARCH0622A01',
  ID: '9010000001',
  TECHNICAL_TRANSACTION_ID: '9010000001_online',
}

export const SCENARIO_ACTIVE_TRANSACTION: ITransaction = {
  ...baseTransaction,
  AUT_CNTR_CRF: SCENARIO_ACTIVE_COMPANY.rnokpp,
  AUT_CNTR_ACC: SCENARIO_ACTIVE_COMPANY.account,
  AUT_CNTR_NAM: SCENARIO_ACTIVE_COMPANY.companyName,
  NUM_DOC: '902',
  OSND: 'Оплата згідно рахунку № 902 від 01.06.2026',
  SUM: '8300.00',
  SUM_E: '8300.00',
  REF: 'SCNACTV0622A02',
  ID: '9020000002',
  TECHNICAL_TRANSACTION_ID: '9020000002_online',
}

export interface ScenarioPayment {
  _id: string
  invoiceNumber: number
  type: Operations
  domain: string
  company: string
  generalSum: number
  description: string
  invoiceCreationDate: Date
  transaction: ReturnType<typeof buildTransactionPayload>
}

/**
 * The Payment document the bank page persists when a transaction is sent to
 * payments (AddPaymentModal / quick send) for `company`.
 */
export function buildScenarioPayment(
  transaction: ITransaction,
  company: IRealestate,
  overrides: Partial<ScenarioPayment> = {}
): ScenarioPayment {
  return {
    _id: `payment-${transaction.ID}`,
    invoiceNumber: Number(transaction.NUM_DOC) || 1,
    type: Operations.Credit,
    domain: SCENARIO_DOMAIN_ID,
    company: String(company._id),
    generalSum: parseFloat(transaction.SUM),
    description: transaction.OSND,
    invoiceCreationDate: parseDate(transaction.DAT_OD, 'DD.MM.YYYY').toDate(),
    transaction: buildTransactionPayload(transaction, [company]),
    ...overrides,
  }
}

/** The transaction as the bank page receives it after checkTransaction. */
export const withMatchResult = (
  transaction: ITransaction,
  result: { isMatchingPayment: boolean; previousCompanyId: string | null }
): ITransaction => ({ ...transaction, ...result })

// --- in-memory Payment model ------------------------------------------------

type Query = Record<string, unknown>

const getPath = (doc: unknown, path: string): unknown =>
  path
    .split('.')
    .reduce<unknown>(
      (value, key) =>
        value == null ? undefined : (value as Record<string, unknown>)[key],
      doc
    )

const matchesCondition = (actual: unknown, condition: unknown): boolean => {
  if (condition && typeof condition === 'object') {
    const c = condition as Record<string, unknown>
    if (Array.isArray(c.$in)) {
      return c.$in.some((v) => String(v) === String(actual))
    }
    if (typeof c.$regex === 'string') {
      return new RegExp(c.$regex, (c.$options as string) || '').test(
        String(actual ?? '')
      )
    }
  }
  return actual != null && String(actual) === String(condition)
}

const matchesQuery = (doc: unknown, query: Query): boolean =>
  Object.entries(query).every(([key, condition]) =>
    key === '$or'
      ? (condition as Query[]).some((sub) => matchesQuery(doc, sub))
      : matchesCondition(getPath(doc, key), condition)
  )

/**
 * Minimal Payment model: supports `find(query)` and
 * `findOne(query).sort({ invoiceCreationDate: -1 }).lean()` with equality,
 * `$in`, `$regex` and `$or` — everything checkTransaction relies on.
 */
export function createScenarioPaymentStore(initial: ScenarioPayment[] = []) {
  const payments = [...initial]

  const latestFirst = (list: ScenarioPayment[]) =>
    [...list].sort(
      (a, b) =>
        new Date(b.invoiceCreationDate).getTime() -
        new Date(a.invoiceCreationDate).getTime()
    )

  return {
    payments,
    add(payment: ScenarioPayment) {
      payments.push(payment)
      return payment
    },
    find: async (query: Query) =>
      payments.filter((payment) => matchesQuery(payment, query)),
    findOne: (query: Query) => ({
      sort: () => ({
        lean: async () =>
          latestFirst(payments).find((payment) =>
            matchesQuery(payment, query)
          ) ?? null,
      }),
    }),
  }
}
