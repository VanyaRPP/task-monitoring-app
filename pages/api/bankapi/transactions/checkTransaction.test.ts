jest.mock('@pages/api/api.config', () => ({
  __esModule: true,
  default: jest.fn(),
  Data: {},
}))

jest.mock('@utils/getCurrentUser', () => ({
  getCurrentUser: jest.fn(),
}))

jest.mock('pages/api/auth/[...nextauth]', () => ({
  __esModule: true,
  default: jest.fn(),
}), { virtual: true })

jest.mock('common/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({}),
}), { virtual: true })

jest.mock('@utils/helpers', () => ({
  toRoundFixed: jest.fn((val) => parseFloat(val).toFixed(2)),
  getPaymentProviderAndReciever: jest.fn(),
}))

jest.mock(
  'pages/api/bankapi/transactions/utils/getTransactions/index',
  () => ({ getTransactionsForDateInterval: jest.fn() }),
  { virtual: true }
)

jest.mock('@modules/models/Payment', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findOne: jest.fn(),
  },
}))

import Payment from '@modules/models/Payment'
import { checkTransaction, normalizeBankAccount } from './index'

describe('normalizeBankAccount', () => {
  it('trims whitespace', () => {
    expect(normalizeBankAccount('  UA123  ')).toBe('UA123')
  })
})

describe('checkTransaction', () => {
  const mockedFind = (Payment as unknown as { find: jest.Mock }).find
  const mockedFindOne = (Payment as unknown as { findOne: jest.Mock }).findOne

  const transaction = {
    TECHNICAL_TRANSACTION_ID: 'tx_001_online',
    AUT_CNTR_MFO: '300001',
    AUT_CNTR_ACC: 'acc-123',
    AUT_CNTR_NAM: 'John Doe',
    OSND: 'Payment description',
    DAT_OD: '22.12.2025',
    SUM: '100.50',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockedFindOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      }),
    })
  })

  it('calls Payment.find with TECHNICAL_TRANSACTION_ID only', async () => {
    mockedFind.mockResolvedValue([{ company: 'company-1' }])

    await checkTransaction({ transaction, domainId: null })

    expect(mockedFind).toHaveBeenCalledTimes(1)
    expect(mockedFind).toHaveBeenCalledWith({
      'transaction.TECHNICAL_TRANSACTION_ID': 'tx_001_online',
    })
  })

  it('does NOT use MFO or generalSum in the query', async () => {
    mockedFind.mockResolvedValue([])

    await checkTransaction({ transaction, domainId: null })

    const callArg = mockedFind.mock.calls[0][0]
    expect(callArg).not.toHaveProperty('$or')
    expect(callArg).not.toHaveProperty('$and')
    expect(callArg).not.toHaveProperty('generalSum')
    expect(JSON.stringify(callArg)).not.toContain('AUT_CNTR_MFO')
  })

  it('returns isMatchingPayment=true and previousCompanyId when payment found', async () => {
    mockedFind.mockResolvedValue([{ company: 'company-123' }])

    const result = await checkTransaction({ transaction, domainId: null })

    expect(result).toEqual({
      isMatchingPayment: true,
      previousCompanyId: 'company-123',
    })
  })

  it('returns isMatchingPayment=false and previousCompanyId=null when no payments found', async () => {
    mockedFind.mockResolvedValue([])

    const result = await checkTransaction({ transaction, domainId: null })

    expect(result).toEqual({
      isMatchingPayment: false,
      previousCompanyId: null,
    })
  })

  it('returns first match when multiple payments found', async () => {
    mockedFind.mockResolvedValue([
      { company: 'company-first' },
      { company: 'company-second' },
    ])

    const result = await checkTransaction({ transaction, domainId: null })

    expect(result.previousCompanyId).toBe('company-first')
    expect(result.isMatchingPayment).toBe(true)
  })

  it('returns false when TECHNICAL_TRANSACTION_ID is missing — no tx match; no domainId for account fallback', async () => {
    const result = await checkTransaction({
      transaction: { ...transaction, TECHNICAL_TRANSACTION_ID: undefined },
      domainId: null,
    })

    expect(mockedFind).not.toHaveBeenCalled()
    expect(mockedFindOne).not.toHaveBeenCalled()
    expect(result).toEqual({
      isMatchingPayment: false,
      previousCompanyId: null,
    })
  })

  it('falls back to last payment by AUT_CNTR_ACC in domain when tx id unknown', async () => {
    mockedFindOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ company: 'company-from-iban' }),
      }),
    })

    const result = await checkTransaction({
      transaction: { ...transaction, TECHNICAL_TRANSACTION_ID: undefined },
      domainId: 'domain-xyz',
    })

    expect(mockedFind).not.toHaveBeenCalled()
    expect(mockedFindOne).toHaveBeenCalled()
    expect(result).toEqual({
      isMatchingPayment: false,
      previousCompanyId: 'company-from-iban',
    })
  })

  it('does NOT fall back to AUT_CNTR_ACC for транзитний рахунок', async () => {
    const result = await checkTransaction({
      transaction: {
        ...transaction,
        TECHNICAL_TRANSACTION_ID: undefined,
        AUT_CNTR_NAM: 'Транз.рахунок платежi',
        OSND: undefined,
      },
      domainId: 'domain-xyz',
    })

    expect(mockedFind).not.toHaveBeenCalled()
    expect(mockedFindOne).not.toHaveBeenCalled()
    expect(result).toEqual({
      isMatchingPayment: false,
      previousCompanyId: null,
    })
  })

  it('falls back to OSND for транзитний рахунок (no txId)', async () => {
    mockedFindOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ company: 'company-from-osnd' }),
      }),
    })

    const result = await checkTransaction({
      transaction: {
        ...transaction,
        TECHNICAL_TRANSACTION_ID: undefined,
        AUT_CNTR_NAM: 'Транз.рахунок платежi',
        OSND: 'Some payment description',
      },
      domainId: 'domain-xyz',
    })

    expect(mockedFind).not.toHaveBeenCalled()
    expect(mockedFindOne).toHaveBeenCalledWith({
      'transaction.OSND': 'Some payment description',
    })
    expect(result).toEqual({
      isMatchingPayment: false,
      previousCompanyId: 'company-from-osnd',
    })
  })

  it('falls back to OSND for транзитний рахунок when txId present but no matching payment', async () => {
    // Real-world scenario: transaction D3K4Q3Q... has a valid txId but was never invoiced,
    // while a sibling transaction D3P3Q41... with the same OSND WAS invoiced.
    // The OSND lookup should find the company from the sibling payment.
    mockedFind.mockResolvedValue([]) // txId search finds nothing
    mockedFindOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ company: 'company-from-osnd' }),
      }),
    })

    const result = await checkTransaction({
      transaction: {
        ...transaction,
        TECHNICAL_TRANSACTION_ID: 'D3K4Q3QAS2IGJEP26032026204100',
        AUT_CNTR_NAM: 'Транз.рахунок платежi_ DN, DG, DZ',
        OSND: 'Сплата за послуги знідно рахунку, Чорна Марина Євгеніївна',
      },
      domainId: 'domain-xyz',
    })

    expect(mockedFind).toHaveBeenCalledWith({
      'transaction.TECHNICAL_TRANSACTION_ID': 'D3K4Q3QAS2IGJEP26032026204100',
    })
    expect(mockedFindOne).toHaveBeenCalledWith({
      'transaction.OSND': 'Сплата за послуги знідно рахунку, Чорна Марина Євгеніївна',
    })
    expect(result).toEqual({
      isMatchingPayment: false,
      previousCompanyId: 'company-from-osnd',
    })
  })

  it('OSND fallback for транзитний рахунок does not include domain filter', async () => {
    // Transit accounts are shared across domains — lookup must be domain-agnostic
    mockedFind.mockResolvedValue([])
    mockedFindOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ company: 'company-from-osnd' }),
      }),
    })

    await checkTransaction({
      transaction: {
        ...transaction,
        TECHNICAL_TRANSACTION_ID: undefined,
        AUT_CNTR_NAM: 'Транз.рахунок платежi',
        OSND: 'Transit payment',
      },
      domainId: 'domain-xyz',
    })

    const findOneArg = mockedFindOne.mock.calls[0][0]
    expect(findOneArg).not.toHaveProperty('domain')
    expect(findOneArg).toEqual({ 'transaction.OSND': 'Transit payment' })
  })

  it('returns false when TECHNICAL_TRANSACTION_ID is empty string — tries account fallback only with domainId', async () => {
    const result = await checkTransaction({
      transaction: { ...transaction, TECHNICAL_TRANSACTION_ID: '' },
      domainId: null,
    })

    expect(mockedFind).not.toHaveBeenCalled()
    expect(mockedFindOne).not.toHaveBeenCalled()
    expect(result).toEqual({
      isMatchingPayment: false,
      previousCompanyId: null,
    })
  })

  it('ANTI-FALSE-POSITIVE: same MFO and sum from different transaction never causes match', async () => {
    mockedFind.mockResolvedValue([])
    const result = await checkTransaction({
      transaction: {
        ...transaction,
        TECHNICAL_TRANSACTION_ID: 'tx_completely_different',
      },
      domainId: null,
    })

    expect(result.isMatchingPayment).toBe(false)

    expect(mockedFind).toHaveBeenCalledWith({
      'transaction.TECHNICAL_TRANSACTION_ID': 'tx_completely_different',
    })
  })

  it('throws Error with original message when Payment.find throws', async () => {
    mockedFind.mockRejectedValue(new Error('DB down'))

    await expect(
      checkTransaction({ transaction, domainId: null })
    ).rejects.toThrow('DB down')
  })
})
