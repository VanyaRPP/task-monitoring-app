import FetchHttpClient from '../FetchHttpClient/FetchHttpClient'

interface AdapterConfigT {
  userAgent: string
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
      'Content-Type': 'application/json;charset=cp1251',
    }
  }

  async getTransactionsForDateInterval(
    acc: string,
    startDate: string,
    endDate?: string,
    followId?: string,
    limit = 20
  ) {
    const searchParams = new URLSearchParams({
      acc,
      startDate,
      limit: limit.toString(),
    })

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
      acc,
      startDate,
      limit: limit.toString(),
    })

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

  async getInterimTransactions(acc: string, followId?: string, limit = 20) {
    const searchParams = new URLSearchParams({
      acc,
      limit: limit.toString(),
    })

    if (followId) searchParams.append('followId', followId)

    return this.httpClient.get(
      'statements/transactions/interim',
      {
        headers: this.getDefaultHeaders(),
      },
      searchParams
    )
  }

  async getInterimBalances(acc: string, followId?: string, limit = 20) {
    const searchParams = new URLSearchParams({
      acc,
      limit: limit.toString(),
    })

    if (followId) searchParams.append('followId', followId)

    return this.httpClient.get(
      'statements/balance/interim',
      {
        headers: this.getDefaultHeaders(),
      },
      searchParams
    )
  }

  async getFinalTransactions(acc: string, followId?: string, limit = 20) {
    const searchParams = new URLSearchParams({
      acc,
      limit: limit.toString(),
    })

    if (followId) searchParams.append('followId', followId)

    return this.httpClient.get(
      'statements/transactions/final',
      {
        headers: this.getDefaultHeaders(),
      },
      searchParams
    )
  }

  async getFinalBalances(acc: string, followId?: string, limit = 20) {
    const searchParams = new URLSearchParams({
      acc,
      limit: limit.toString(),
    })

    if (followId) searchParams.append('followId', followId)

    return this.httpClient.get(
      'statements/balance/final',
      {
        headers: this.getDefaultHeaders(),
      },
      searchParams
    )
  }
}

export default PrivatBankApiAdapter
