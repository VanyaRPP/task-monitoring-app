/**
 * End-to-end check of the mock scenario "bank invoice → payment → «Платіж є»"
 * against the real checkTransaction, with the Payment model backed by the
 * scenario's in-memory store.
 */
jest.mock('@pages/api/api.config', () => ({
  __esModule: true,
  default: jest.fn(),
  Data: {},
}))

jest.mock('@utils/getCurrentUser', () => ({
  getCurrentUser: jest.fn(),
}))

jest.mock(
  'pages/api/bankapi/transactions/utils/getTransactions/index',
  () => ({ getTransactionsForDateInterval: jest.fn() }),
  { virtual: true }
)

jest.mock('@modules/models/Payment', () => ({
  __esModule: true,
  default: { find: jest.fn(), findOne: jest.fn() },
}))

jest.mock('@modules/models/RealEstate', () => ({
  __esModule: true,
  default: { find: jest.fn() },
}))

import Payment from '@modules/models/Payment'
import {
  SCENARIO_ACTIVE_COMPANY,
  SCENARIO_ACTIVE_TRANSACTION,
  SCENARIO_ARCHIVED_COMPANY,
  SCENARIO_ARCHIVED_TRANSACTION,
  SCENARIO_DOMAIN_ID,
  buildScenarioPayment,
  createScenarioPaymentStore,
  withMatchResult,
} from '@common/api/bankApi/mocks/bankToPaymentScenario'
import { Operations } from '@utils/constants'
import { checkTransaction } from './index'

const mockedPayment = Payment as unknown as {
  find: jest.Mock
  findOne: jest.Mock
}

const useStore = (store: ReturnType<typeof createScenarioPaymentStore>) => {
  mockedPayment.find.mockImplementation(store.find)
  mockedPayment.findOne.mockImplementation(store.findOne)
}

const domainId = SCENARIO_DOMAIN_ID
const companies = [SCENARIO_ACTIVE_COMPANY, SCENARIO_ARCHIVED_COMPANY]

describe('Mock scenario: bank invoice → payment → «Платіж є»', () => {
  beforeEach(() => jest.clearAllMocks())

  it('a bank transaction without a payment has no «Платіж є» flag', async () => {
    useStore(createScenarioPaymentStore())

    const result = await checkTransaction({
      transaction: SCENARIO_ACTIVE_TRANSACTION,
      domainId,
      companies,
    })

    expect(result.isMatchingPayment).toBe(false)
  })

  it('the payment created from the bank row stores the canonical transaction id and links the company', () => {
    const payment = buildScenarioPayment(
      SCENARIO_ACTIVE_TRANSACTION,
      SCENARIO_ACTIVE_COMPANY
    )

    expect(payment).toMatchObject({
      type: Operations.Credit,
      company: SCENARIO_ACTIVE_COMPANY._id,
      generalSum: 8300,
      transaction: {
        // REF + REFN + date + time — not the bank's "_online" id
        TECHNICAL_TRANSACTION_ID: 'SCNACTV0622A02P22062026122300',
        AUT_CNTR_ACC: SCENARIO_ACTIVE_COMPANY.account,
        AUT_CNTR_CRF: SCENARIO_ACTIVE_COMPANY.rnokpp,
        OSND: SCENARIO_ACTIVE_TRANSACTION.OSND,
      },
    })
  })

  it('after the invoice lands in payments, the bank row gets «Платіж є» for that company', async () => {
    const store = createScenarioPaymentStore()
    useStore(store)
    store.add(
      buildScenarioPayment(SCENARIO_ACTIVE_TRANSACTION, SCENARIO_ACTIVE_COMPANY)
    )

    const result = await checkTransaction({
      transaction: SCENARIO_ACTIVE_TRANSACTION,
      domainId,
      companies,
    })

    expect(result).toEqual({
      isMatchingPayment: true,
      previousCompanyId: SCENARIO_ACTIVE_COMPANY._id,
    })
    expect(withMatchResult(SCENARIO_ACTIVE_TRANSACTION, result)).toMatchObject({
      isMatchingPayment: true,
      previousCompanyId: SCENARIO_ACTIVE_COMPANY._id,
    })
  })

  it('a payment for one transaction does not flag another transaction', async () => {
    const store = createScenarioPaymentStore([
      buildScenarioPayment(
        SCENARIO_ACTIVE_TRANSACTION,
        SCENARIO_ACTIVE_COMPANY
      ),
    ])
    useStore(store)

    const result = await checkTransaction({
      transaction: SCENARIO_ARCHIVED_TRANSACTION,
      domainId,
      companies,
    })

    expect(result.isMatchingPayment).toBe(false)
  })

  it('the link survives archiving the company: still «Платіж є» with the archived company id', async () => {
    useStore(
      createScenarioPaymentStore([
        buildScenarioPayment(
          SCENARIO_ARCHIVED_TRANSACTION,
          SCENARIO_ARCHIVED_COMPANY
        ),
      ])
    )

    const result = await checkTransaction({
      transaction: SCENARIO_ARCHIVED_TRANSACTION,
      domainId,
      // archived company is not part of the active list anymore
      companies: [SCENARIO_ACTIVE_COMPANY],
    })

    expect(result).toEqual({
      isMatchingPayment: true,
      previousCompanyId: SCENARIO_ARCHIVED_COMPANY._id,
    })
  })

  it('the scenario store answers the history fallback queries (account / tax code)', async () => {
    useStore(
      createScenarioPaymentStore([
        buildScenarioPayment(
          SCENARIO_ARCHIVED_TRANSACTION,
          SCENARIO_ARCHIVED_COMPANY
        ),
      ])
    )

    // A new transaction from the same payer: no tx-id match, but history by
    // account resolves the company (without the «Платіж є» flag).
    const result = await checkTransaction({
      transaction: {
        ...SCENARIO_ARCHIVED_TRANSACTION,
        REF: 'SCNARCH0723B01',
        ID: '9030000003',
        TECHNICAL_TRANSACTION_ID: '9030000003_online',
      },
      domainId,
      companies: [SCENARIO_ACTIVE_COMPANY],
    })

    expect(result).toEqual({
      isMatchingPayment: false,
      previousCompanyId: SCENARIO_ARCHIVED_COMPANY._id,
    })
  })
})
