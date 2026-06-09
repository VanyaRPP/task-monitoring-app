import PrivatBankApiAdapter from './PrivatBankApiAdapter'
import type FetchHttpClient from '../FetchHttpClient/FetchHttpClient'

const expectedHeaders = {
  'User-Agent': 'jest-agent',
  token: 'secret-token',
  'Content-type': 'application/json;charset=utf-8',
}

describe('PrivatBankApiAdapter', () => {
  let get: jest.Mock
  let adapter: PrivatBankApiAdapter

  beforeEach(() => {
    get = jest.fn().mockResolvedValue('ok')
    const httpClient = { get } as unknown as FetchHttpClient
    adapter = new PrivatBankApiAdapter(httpClient, {
      userAgent: 'jest-agent',
      token: 'secret-token',
    })
  })

  // search params are the 3rd argument of the underlying client.get call
  const paramsOf = (call = 0) =>
    (get.mock.calls[call][2] as URLSearchParams).toString()

  it('sends auth headers on a request without query params', async () => {
    const result = await adapter.getBankDates()

    expect(get).toHaveBeenCalledWith('statements/settings', {
      headers: expectedHeaders,
    })
    expect(result).toBe('ok')
  })

  describe('getTransactionsForDateInterval', () => {
    it('hits the transactions endpoint with startDate and the default limit', async () => {
      const result = await adapter.getTransactionsForDateInterval('2024-01-01')

      expect(get).toHaveBeenCalledWith(
        'statements/transactions',
        { headers: expectedHeaders },
        expect.any(URLSearchParams)
      )
      expect(paramsOf()).toBe('startDate=2024-01-01&limit=100')
      expect(result).toBe('ok')
    })

    it('appends acc, endDate and followId when provided', async () => {
      await adapter.getTransactionsForDateInterval(
        '2024-01-01',
        50,
        'follow-1',
        '2024-01-31',
        'UA00'
      )

      expect(paramsOf()).toBe(
        'startDate=2024-01-01&limit=50&acc=UA00&endDate=2024-01-31&followId=follow-1'
      )
    })
  })

  it('getBalancesForDateInterval hits the balance endpoint', async () => {
    await adapter.getBalancesForDateInterval(
      'UA00',
      '2024-01-01',
      '2024-01-31',
      'f1',
      5
    )

    expect(get).toHaveBeenCalledWith(
      'statements/balance',
      { headers: expectedHeaders },
      expect.any(URLSearchParams)
    )
    expect(paramsOf()).toBe(
      'startDate=2024-01-01&limit=5&acc=UA00&endDate=2024-01-31&followId=f1'
    )
  })

  it('getInterimTransactions hits the interim transactions endpoint', async () => {
    await adapter.getInterimTransactions(10, 'UA00', 'f1')

    expect(get).toHaveBeenCalledWith(
      'statements/transactions/interim',
      { headers: expectedHeaders },
      expect.any(URLSearchParams)
    )
    expect(paramsOf()).toBe('limit=10&acc=UA00&followId=f1')
  })

  it('getInterimBalances hits the interim balance endpoint', async () => {
    await adapter.getInterimBalances('UA00', 'f1', 7)

    expect(get).toHaveBeenCalledWith(
      'statements/balance/interim',
      { headers: expectedHeaders },
      expect.any(URLSearchParams)
    )
    expect(paramsOf()).toBe('limit=7&acc=UA00&followId=f1')
  })

  it('getFinalTransactions hits the final transactions endpoint', async () => {
    await adapter.getFinalTransactions(15, 'f1', 'UA00')

    expect(get).toHaveBeenCalledWith(
      'statements/transactions/final',
      { headers: expectedHeaders },
      expect.any(URLSearchParams)
    )
    expect(paramsOf()).toBe('limit=15&acc=UA00&followId=f1')
  })

  it('getFinalBalances hits the final balance endpoint', async () => {
    await adapter.getFinalBalances(25, 'f1', 'UA00')

    expect(get).toHaveBeenCalledWith(
      'statements/balance/final',
      { headers: expectedHeaders },
      expect.any(URLSearchParams)
    )
    expect(paramsOf()).toBe('limit=25&acc=UA00&followId=f1')
  })
})
