import PrivatBankApiAdapter from '@utils/bankUtils/PrivatBankApiAdapter'
import FetchHttpClient from '@utils/FetchHttpClient/FetchHttpClient'

const httpClient = new FetchHttpClient({
  baseURL: 'https://acp.privatbank.ua/api',
})

export async function getFinalTransactions(token: string, limit?: number) {
  const apiPrivatAdapter = new PrivatBankApiAdapter(httpClient, {
    token: token,
  })
  try {
    const finalTransactions = await apiPrivatAdapter.getFinalTransactions(limit)
    return finalTransactions
  } catch (error) {
    throw new Error(`Error in fetch ${error}`)
  }
}
export async function getInterimTransactions(token: string, limit?: number) {
  const apiPrivatAdapter = new PrivatBankApiAdapter(httpClient, {
    token: token,
  })
  try {
    const finalTransactions = await apiPrivatAdapter.getInterimTransactions(
      limit
    )
    return finalTransactions
  } catch (error) {
    throw new Error(`Error in fetch ${error}`)
  }
}
export async function getTransactionsForDateInterval(
  token: string,
  limit?: number
) {
  const apiPrivatAdapter = new PrivatBankApiAdapter(httpClient, {
    token: token,
  })
  try {
    const transactions = await apiPrivatAdapter.getTransactionsForDateInterval(
      '31-1-2022',
      limit
    )
    return transactions
  } catch (error) {
    throw new Error(`Error in fetch ${error}`)
  }
}
