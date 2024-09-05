import PrivatBankApiAdapter from '@utils/bankUtils/PrivatBankApiAdapter'
import FetchHttpClient from '@utils/FetchHttpClient/FetchHttpClient'
import { getDefaultStartDate } from '@utils/helpers'
import dayjs from 'dayjs'

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
export async function getInterimTransactions(
  token: string,
  limit?: number,
  followId?: string
) {
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
  startDate?: string,
  limit?: number,
  followId?: string
) {
  const apiPrivatAdapter = new PrivatBankApiAdapter(httpClient, {
    token: token,
  })
  try {
    const transactions = await apiPrivatAdapter.getTransactionsForDateInterval(
      startDate ?? getDefaultStartDate(),
      limit,
      followId
    )
    return transactions
  } catch (error) {
    throw new Error(`Error in fetch ${error}`)
  }
}
