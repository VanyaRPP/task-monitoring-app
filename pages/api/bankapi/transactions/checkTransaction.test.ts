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
  default: { find: jest.fn() },
}))

import Payment from '@modules/models/Payment'
import { checkTransaction } from './index'

describe('checkTransaction', () => {
  const mockedFind = (Payment as unknown as { find: jest.Mock }).find

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
  })

  

  it('calls Payment.find with TECHNICAL_TRANSACTION_ID only', async () => {
    mockedFind.mockResolvedValue([{ company: 'company-1' }])

    await checkTransaction({ transaction })

    expect(mockedFind).toHaveBeenCalledTimes(1)
    expect(mockedFind).toHaveBeenCalledWith({
      'transaction.TECHNICAL_TRANSACTION_ID': 'tx_001_online',
    })
  })

  it('does NOT use MFO or generalSum in the query', async () => {
    mockedFind.mockResolvedValue([])

    await checkTransaction({ transaction })

    const callArg = mockedFind.mock.calls[0][0]
    expect(callArg).not.toHaveProperty('$or')
    expect(callArg).not.toHaveProperty('$and')
    expect(callArg).not.toHaveProperty('generalSum')
    expect(JSON.stringify(callArg)).not.toContain('AUT_CNTR_MFO')
  })

  

  it('returns isMatchingPayment=true and previousCompanyId when payment found', async () => {
    mockedFind.mockResolvedValue([{ company: 'company-123' }])

    const result = await checkTransaction({ transaction })

    expect(result).toEqual({
      isMatchingPayment: true,
      previousCompanyId: 'company-123',
    })
  })

  it('returns isMatchingPayment=false and previousCompanyId=null when no payments found', async () => {
    mockedFind.mockResolvedValue([])

    const result = await checkTransaction({ transaction })

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

    const result = await checkTransaction({ transaction })

    expect(result.previousCompanyId).toBe('company-first')
    expect(result.isMatchingPayment).toBe(true)
  })

  it('returns false when TECHNICAL_TRANSACTION_ID is missing — no guessing', async () => {
    const result = await checkTransaction({
      transaction: { ...transaction, TECHNICAL_TRANSACTION_ID: undefined },
    })

    
    expect(mockedFind).not.toHaveBeenCalled()
    expect(result).toEqual({
      isMatchingPayment: false,
      previousCompanyId: null,
    })
  })

  it('returns false when TECHNICAL_TRANSACTION_ID is empty string — no guessing', async () => {
    const result = await checkTransaction({
      transaction: { ...transaction, TECHNICAL_TRANSACTION_ID: '' },
    })

    expect(mockedFind).not.toHaveBeenCalled()
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
    })

    expect(result.isMatchingPayment).toBe(false)
    
    expect(mockedFind).toHaveBeenCalledWith({
      'transaction.TECHNICAL_TRANSACTION_ID': 'tx_completely_different',
    })
  })

  it('throws Error with original message when Payment.find throws', async () => {
    mockedFind.mockRejectedValue(new Error('DB down'))

    await expect(checkTransaction({ transaction })).rejects.toThrow('DB down')
  })
})