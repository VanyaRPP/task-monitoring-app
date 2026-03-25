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

  it('calls Payment.find with $or containing TECHNICAL_TRANSACTION_ID and MFO+sum fallback', async () => {
    mockedFind.mockResolvedValue([{ company: 'company-1' }])

    await checkTransaction({ transaction })

    expect(mockedFind).toHaveBeenCalledTimes(1)
    expect(mockedFind).toHaveBeenCalledWith({
      $or: [
        { 'transaction.TECHNICAL_TRANSACTION_ID': 'tx_001_online' },
        {
          $and: [
            {
              $expr: {
                $eq: [
                  { $trim: { input: { $ifNull: ['$transaction.AUT_CNTR_MFO', ''] } } },
                  '300001',
                ],
              },
            },
            { generalSum: 100.50 },
          ],
        },
      ],
    })
  })

  it('returns isMatchingPayment=true when new payment found by TECHNICAL_TRANSACTION_ID', async () => {
    mockedFind.mockResolvedValue([{ company: 'company-123' }])

    const result = await checkTransaction({ transaction })

    expect(result).toEqual({
      isMatchingPayment: true,
      previousCompanyId: 'company-123',
    })
  })

  it('still finds old payments when TECHNICAL_TRANSACTION_ID is missing (fallback via MFO+sum)', async () => {
    mockedFind.mockResolvedValue([{ company: 'old-company' }])

    const result = await checkTransaction({
      transaction: { ...transaction, TECHNICAL_TRANSACTION_ID: undefined },
    })

    expect(result).toEqual({
      isMatchingPayment: true,
      previousCompanyId: 'old-company',
    })

    expect(mockedFind).toHaveBeenCalledWith(
      expect.objectContaining({ $or: expect.any(Array) })
    )
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

  it('throws Error with original message when Payment.find throws', async () => {
    mockedFind.mockRejectedValue(new Error('DB down'))

    await expect(checkTransaction({ transaction })).rejects.toThrow('DB down')
  })

  it('coerces SUM string to number for generalSum comparison', async () => {
    mockedFind.mockResolvedValue([])

    await checkTransaction({ transaction: { ...transaction, SUM: '9134.25' } })

    const callArg = mockedFind.mock.calls[0][0]
    const andClause = callArg.$or[1].$and
    const sumClause = andClause.find((c: any) => c.generalSum !== undefined)
    expect(sumClause.generalSum).toBe(9134.25)
  })
})