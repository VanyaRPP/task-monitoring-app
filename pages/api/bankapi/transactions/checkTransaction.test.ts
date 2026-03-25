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
    AUT_CNTR_ACC: 'acc-123',
    AUT_CNTR_NAM: 'John Doe',
    AUT_CNTR_MFO: '300001',
    OSND: 'Payment description',
    SUM: '100.50',
  }

  beforeEach(() => {
    jest.clearAllMocks() 
  })

it('calls Payment.find with TECHNICAL_TRANSACTION_ID, trimmed MFO and rounded SUM', async () => {
  mockedFind.mockResolvedValue([{ company: 'company-1' }])

  await checkTransaction({ transaction })

  expect(mockedFind).toHaveBeenCalledTimes(1)
  expect(mockedFind).toHaveBeenCalledWith({
    'transaction.TECHNICAL_TRANSACTION_ID': 'tx_001_online',
    $and: [
      {
        $expr: {
          $eq: [
            {
              $trim: {
                input: { $ifNull: ['$transaction.AUT_CNTR_MFO', ''] },
              },
            },
            '300001',
          ],
        },
      },
      { generalSum: 100.5 },
    ],
  })
})

  it('returns isMatchingPayment=true and previousCompanyId when payment exists', async () => {
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

  it('returns first match when multiple payments exist for same transaction', async () => {
    mockedFind.mockResolvedValue([
      { company: 'company-first' },
      { company: 'company-second' },
    ])

    const result = await checkTransaction({ transaction })

    expect(result.previousCompanyId).toBe('company-first')
  })

  it('throws Error when Payment.find throws', async () => {
    mockedFind.mockRejectedValue(new Error('DB down'))

    await expect(checkTransaction({ transaction })).rejects.toThrow('DB down')
  })

  it('handles missing TECHNICAL_TRANSACTION_ID gracefully', async () => {
    mockedFind.mockResolvedValue([])

    const result = await checkTransaction({
      transaction: { ...transaction, TECHNICAL_TRANSACTION_ID: undefined },
    })

    expect(result).toEqual({
      isMatchingPayment: false,
      previousCompanyId: null,
    })
  })
})