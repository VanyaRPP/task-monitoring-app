import FetchHttpClient from '../FetchHttpClient/FetchHttpClient'

interface AdapterConfigT {
  userAgent?: string
  token: string
}

class PrivatBankApiAdapter {
  private httpClient: FetchHttpClient
  private userAgent: string
  private token: string

  constructor(httpClient: FetchHttpClient, config: AdapterConfigT) {
    this.httpClient = httpClient
    this.userAgent = config.userAgent
    this.token = config.token
  }

  private getDefaultHeaders(): Record<string, string> {
    return {
      'User-Agent': this.userAgent,
      token: this.token,
      'Content-type': 'application/json;charset=utf-8',
    }
  }

  async getTransactionsForDateInterval(
    startDate: string,
    limit = 100,
    followId?: string,
    endDate?: string,
    acc?: string
  ) {
    const searchParams = new URLSearchParams({
      startDate,
      limit: limit.toString(),
    })
    if (acc) searchParams.append('acc', acc)
    if (endDate) searchParams.append('endDate', endDate)
    if (followId) searchParams.append('followId', followId)

    return this.httpClient.get(
      'statements/transactions',
      {
        headers: this.getDefaultHeaders(),
      },
      searchParams
    )
  }

  async getBalancesForDateInterval(
    acc: string,
    startDate: string,
    endDate?: string,
    followId?: string,
    limit = 20
  ) {
    const searchParams = new URLSearchParams({
      startDate,
      limit: limit.toString(),
    })
    if (acc) searchParams.append('acc', acc)
    if (endDate) searchParams.append('endDate', endDate)
    if (followId) searchParams.append('followId', followId)

    return this.httpClient.get(
      'statements/balance',
      {
        headers: this.getDefaultHeaders(),
      },
      searchParams
    )
  }

  async getInterimTransactions(limit = 100, acc?: string, followId?: string) {
    const searchParams = new URLSearchParams({
      limit: limit.toString(),
    })

    if (acc) searchParams.append('acc', acc)
    if (followId) searchParams.append('followId', followId)

    return this.httpClient.get(
      'statements/transactions/interim',
      {
        headers: this.getDefaultHeaders(),
      },
      searchParams
    )
  }

  async getInterimBalances(acc?: string, followId?: string, limit = 100) {
    const searchParams = new URLSearchParams({
      limit: limit.toString(),
    })
    if (acc) searchParams.append('acc', acc)
    if (followId) searchParams.append('followId', followId)

    return this.httpClient.get(
      'statements/balance/interim',
      {
        headers: this.getDefaultHeaders(),
      },
      searchParams
    )
  }

  async getFinalTransactions(limit = 20, followId?: string, acc?: string) {
    const searchParams = new URLSearchParams({
      limit: limit.toString(),
    })

    if (acc) searchParams.append('acc', acc)
    if (followId) searchParams.append('followId', followId)

    return this.httpClient.get(
      'statements/transactions/final',
      {
        headers: this.getDefaultHeaders(),
      },
      searchParams
    )
  }

  async getFinalBalances(limit = 100, followId?: string, acc?: string) {
    const searchParams = new URLSearchParams({
      limit: limit.toString(),
    })

    if (acc) searchParams.append('acc', acc)
    if (followId) searchParams.append('followId', followId)

    return this.httpClient.get(
      'statements/balance/final',
      {
        headers: this.getDefaultHeaders(),
      },
      searchParams
    )
  }
  async getBankDates() {
    return this.httpClient.get('statements/settings', {
      headers: this.getDefaultHeaders(),
    })
  }
}

export default PrivatBankApiAdapter
