jest.mock('@pages/api/api.config', () => ({
  __esModule: true,
  default: jest.fn(),
  Data: {},
}))

jest.mock('@utils/getCurrentUser', () => ({
  getCurrentUser: jest.fn(),
}))

jest.mock(
  'pages/api/auth/[...nextauth]',
  () => ({
    __esModule: true,
    default: jest.fn(),
  }),
  { virtual: true }
)

jest.mock(
  'common/lib/mongodb',
  () => ({
    __esModule: true,
    default: jest.fn().mockResolvedValue({}),
  }),
  { virtual: true }
)

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

jest.mock('@modules/models/RealEstate', () => ({
  __esModule: true,
  default: { find: jest.fn() },
}))

import Payment from '@modules/models/Payment'
import {
  checkTransaction,
  matchCompanyByIdentity,
  normalizeBankAccount,
} from './index'

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

  it('calls Payment.find with normalized TECHNICAL_TRANSACTION_ID (strips _online suffix)', async () => {
    mockedFind.mockResolvedValue([{ company: 'company-1' }])

    await checkTransaction({ transaction, domainId: null })

    expect(mockedFind).toHaveBeenCalledTimes(1)
    expect(mockedFind).toHaveBeenCalledWith({
      'transaction.TECHNICAL_TRANSACTION_ID': {
        $in: ['tx_001_online', 'tx_001'],
      },
    })
  })

  it('reconstructs final TECHNICAL_TRANSACTION_ID from REF+REFN+date+time and matches Payments stored in final form', async () => {
    mockedFind.mockResolvedValue([{ company: 'company-reconstructed' }])

    const result = await checkTransaction({
      transaction: {
        ...transaction,
        TECHNICAL_TRANSACTION_ID: '4934881536_online',
        REF: 'HS4HQ0501K01UM',
        REFN: 'P',
        DATE_TIME_DAT_OD_TIM_P: '01.05.2026 10:33:00',
      },
      domainId: null,
    })

    expect(mockedFind).toHaveBeenCalledWith({
      'transaction.TECHNICAL_TRANSACTION_ID': {
        $in: [
          '4934881536_online',
          '4934881536',
          'HS4HQ0501K01UMP01052026103300',
        ],
      },
    })
    expect(result).toEqual({
      isMatchingPayment: true,
      previousCompanyId: 'company-reconstructed',
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

  it('fallback query matches a prior payment by BOTH account and payer name', async () => {
    // A new account for a known payer: the query must also try the name so the
    // older payment (stored under a different account) can be found.
    mockedFind.mockResolvedValue([]) // brand-new tx, never invoiced
    mockedFindOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      }),
    })

    await checkTransaction({
      transaction: {
        ...transaction,
        TECHNICAL_TRANSACTION_ID: undefined,
        AUT_CNTR_ACC: 'UA000000000000000000000000001',
        AUT_CNTR_NAM: 'КАРТКОВИЙ - ФОП Петренко Петро Петрович',
      },
      domainId: 'domain-xyz',
    })

    expect(mockedFindOne).toHaveBeenCalledWith({
      domain: 'domain-xyz',
      $or: [
        { 'transaction.AUT_CNTR_ACC': 'UA000000000000000000000000001' },
        {
          'transaction.AUT_CNTR_NAM': {
            $regex: 'ПЕТРЕНКО\\s+ПЕТРО\\s+ПЕТРОВИЧ',
            $options: 'i',
          },
        },
      ],
    })
  })

  it('fallback query matches a prior payment by tax code (AUT_CNTR_CRF) too', async () => {
    mockedFind.mockResolvedValue([]) // no txid match
    mockedFindOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      }),
    })

    await checkTransaction({
      transaction: {
        ...transaction,
        TECHNICAL_TRANSACTION_ID: undefined,
        AUT_CNTR_ACC: 'UA000000000000000000000000001',
        AUT_CNTR_CRF: '2534567890',
        AUT_CNTR_NAM: 'ФОП Payer One',
      },
      domainId: 'domain-xyz',
    })

    expect(mockedFindOne).toHaveBeenCalledWith({
      domain: 'domain-xyz',
      $or: [
        { 'transaction.AUT_CNTR_ACC': 'UA000000000000000000000000001' },
        { 'transaction.AUT_CNTR_CRF': '2534567890' },
        {
          'transaction.AUT_CNTR_NAM': {
            $regex: 'PAYER\\s+ONE',
            $options: 'i',
          },
        },
      ],
    })
  })

  it('ON-AIR by name history: resolves company from a prior payment of the same payer on a NEW account', async () => {
    mockedFind.mockResolvedValue([]) // no txid match
    mockedFindOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest
          .fn()
          .mockResolvedValue({ company: 'company-from-name-history' }),
      }),
    })

    const result = await checkTransaction({
      transaction: {
        ...transaction,
        TECHNICAL_TRANSACTION_ID: undefined,
        AUT_CNTR_ACC: 'UA813348510000000026000253475',
        AUT_CNTR_NAM: 'КАРТКОВИЙ - ФОП Петренко Петро Петрович',
      },
      domainId: 'domain-xyz',
    })

    expect(result).toEqual({
      isMatchingPayment: false,
      previousCompanyId: 'company-from-name-history',
    })
  })

  it('does NOT run the account fallback for a self-transaction (AUT_CNTR_CRF === AUT_MY_CRF)', async () => {
    // Owner pays themselves — must not match the owner's own company via the
    // account fallback.
    mockedFind.mockResolvedValue([]) // brand-new tx, never invoiced

    const result = await checkTransaction({
      transaction: {
        ...transaction,
        TECHNICAL_TRANSACTION_ID: undefined,
        AUT_MY_CRF: '9999999999',
        AUT_CNTR_CRF: '9999999999',
        AUT_CNTR_NAM: 'DOMAIN OWNER',
        OSND: 'return of funds',
      },
      domainId: 'domain-xyz',
    })

    expect(mockedFindOne).not.toHaveBeenCalled()
    expect(result).toEqual({
      isMatchingPayment: false,
      previousCompanyId: null,
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
      'transaction.TECHNICAL_TRANSACTION_ID': {
        $in: ['D3K4Q3QAS2IGJEP26032026204100'],
      },
    })
    expect(mockedFindOne).toHaveBeenCalledWith({
      'transaction.OSND':
        'Сплата за послуги знідно рахунку, Чорна Марина Євгеніївна',
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
      'transaction.TECHNICAL_TRANSACTION_ID': {
        $in: ['tx_completely_different'],
      },
    })
  })

  it('throws Error with original message when Payment.find throws', async () => {
    mockedFind.mockRejectedValue(new Error('DB down'))

    await expect(
      checkTransaction({ transaction, domainId: null })
    ).rejects.toThrow('DB down')
  })

  it('ON-AIR: resolves company from the domain company list by tax code when no saved payment exists', async () => {
    // First-ever payment from a new account: no txid/account history, but the
    // company carries the payer tax code → identity match sets previousCompanyId.
    mockedFind.mockResolvedValue([]) // no txid match

    const result = await checkTransaction({
      transaction: {
        ...transaction,
        TECHNICAL_TRANSACTION_ID: undefined,
        AUT_CNTR_CRF: '3440713349',
        AUT_CNTR_ACC: 'UA000000000000000000000000001',
        AUT_CNTR_NAM: 'ФОП Payer One',
      },
      domainId: 'domain-xyz',
      companies: [
        {
          _id: 'company-identity',
          companyName: 'ФОП Payer One',
          rnokpp: '3440713349',
        },
      ],
    })

    expect(result).toEqual({
      isMatchingPayment: false,
      previousCompanyId: 'company-identity',
    })
  })

  it('ON-AIR: does not identity-match a self-transaction', async () => {
    mockedFind.mockResolvedValue([])

    const result = await checkTransaction({
      transaction: {
        ...transaction,
        TECHNICAL_TRANSACTION_ID: undefined,
        AUT_MY_CRF: '2479002623',
        AUT_CNTR_CRF: '2479002623',
        AUT_CNTR_NAM: 'DOMAIN OWNER',
      },
      domainId: 'domain-xyz',
      companies: [
        {
          _id: 'owner-company',
          companyName: 'DOMAIN OWNER',
          rnokpp: '2479002623',
        },
      ],
    })

    expect(result).toEqual({
      isMatchingPayment: false,
      previousCompanyId: null,
    })
  })
})

describe('matchCompanyByIdentity', () => {
  const base = {
    AUT_MY_CRF: '2479002623',
    AUT_CNTR_CRF: '3440713349',
    AUT_CNTR_ACC: 'UA000000000000000000000000001',
    AUT_CNTR_NAM: 'ФОП Payer One',
    RECIPIENT_ULTMT_NCEO: '',
  }

  it('matches by counterparty tax code (AUT_CNTR_CRF)', () => {
    expect(
      matchCompanyByIdentity(base, [
        { _id: 'c1', companyName: 'Хтось інший', rnokpp: '3440713349' },
      ])
    ).toBe('c1')
  })

  it('matches by full name when company has no rnokpp', () => {
    expect(
      matchCompanyByIdentity({ ...base, AUT_CNTR_CRF: '' }, [
        { _id: 'c2', companyName: 'ФОП Payer One', rnokpp: '' },
      ])
    ).toBe('c2')
  })

  it('stringifies a non-string company id', () => {
    expect(
      matchCompanyByIdentity(base, [
        {
          _id: { toString: () => 'obj-id' },
          companyName: 'X',
          rnokpp: '3440713349',
        },
      ])
    ).toBe('obj-id')
  })

  it('returns null for a self-transaction even if a company matches', () => {
    expect(
      matchCompanyByIdentity(
        { ...base, AUT_CNTR_CRF: '2479002623', AUT_CNTR_NAM: 'DOMAIN OWNER' },
        [{ _id: 'own', companyName: 'DOMAIN OWNER', rnokpp: '2479002623' }]
      )
    ).toBeNull()
  })

  it('returns null when nothing matches or the list is empty', () => {
    expect(matchCompanyByIdentity(base, [])).toBeNull()
    expect(
      matchCompanyByIdentity(base, [
        { _id: 'x', companyName: 'Різна Людина', rnokpp: '0000000000' },
      ])
    ).toBeNull()
  })
})
