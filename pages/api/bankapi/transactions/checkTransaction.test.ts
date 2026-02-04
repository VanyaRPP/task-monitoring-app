jest.mock('@pages/api/api.config', () => ({
  __esModule: true,
  default: jest.fn(),
  Data: {},
}))

jest.mock('@modules/models/Payment', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
  },
}))

import Payment from '@modules/models/Payment'

describe('checkTransaction', () => {
  const mockedPayment = Payment as unknown as { find: jest.Mock }

  const transaction = {
    AUT_CNTR_ACC: 'acc-123',
    AUT_CNTR_NAM: 'John Doe',
    AUT_CNTR_MFO: '300001',
    OSND: 'Payment description',
    SUM: '100.50',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls Payment.find with correct mongo query (and coerces SUM to number)', async () => {
    mockedPayment.find.mockResolvedValue([{ company: 'company-1' }])

    const { checkTransaction } = await import('./index')
    await checkTransaction({ transaction })

    expect(mockedPayment.find).toHaveBeenCalledTimes(1)
    expect(mockedPayment.find).toHaveBeenCalledWith({
      $and: [
        { 'transaction.AUT_CNTR_ACC': 'acc-123' },
        { 'transaction.AUT_CNTR_NAM': 'John Doe' },
        { 'transaction.AUT_CNTR_MFO': '300001' },
        { 'transaction.Description': 'Payment description' },
        { generalSum: 100.5 },
      ],
    })
  })

  it('returns isMatchingPayment=true and previousCompanyId when payment exists', async () => {
    mockedPayment.find.mockResolvedValue([{ company: 'company-123' }])

    const { checkTransaction } = await import('./index')
    const result = await checkTransaction({ transaction })

    expect(result).toEqual({
      isMatchingPayment: true,
      previousCompanyId: 'company-123',
    })
  })

  it('throws Error when Payment.find throws (keeps message)', async () => {
    mockedPayment.find.mockRejectedValue(new Error('DB down'))

    const { checkTransaction } = await import('./index')
    await expect(checkTransaction({ transaction })).rejects.toThrow('DB down')
  })

  it('BUG CASE: when Payment.find returns [], function crashes on allPayments[0].company', async () => {
    mockedPayment.find.mockResolvedValue([])

    const { checkTransaction } = await import('./index')
    await expect(checkTransaction({ transaction })).rejects.toThrow()
  })
})
