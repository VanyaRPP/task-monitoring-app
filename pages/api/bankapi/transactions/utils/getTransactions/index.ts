import { ITransaction } from '@components/Pages/BankTransactions/components/TransactionsTable/components/transactionTypes'
import PrivatBankApiAdapter from '@utils/bankUtils/PrivatBankApiAdapter'
import FetchHttpClient from '@utils/FetchHttpClient/FetchHttpClient'
import { getDefaultStartDate } from '@utils/helpers'
import dayjs from 'dayjs'

interface TransactionsData {
  transactions: ITransaction[]
  next_page_id?: string
  exist_next_page: boolean
}
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
  limit: number = 20,
  followId?: string
) {
  const apiPrivatAdapter = new PrivatBankApiAdapter(httpClient, {
    token: token,
  })

  let allTransactions: ITransaction[] = []
  let currentFollowId: string | undefined = followId

  const calculatedStartDate = startDate ?? getDefaultStartDateThreeMonthsAgo()

  try {
    while (true) {
      const response = (await apiPrivatAdapter.getTransactionsForDateInterval(
        calculatedStartDate,
        limit - allTransactions.length,
        currentFollowId
      )) as TransactionsData

      const transactions = response.transactions

      if (Array.isArray(transactions)) {
        allTransactions = [...allTransactions, ...transactions]

        if (response.exist_next_page) {
          currentFollowId = response.next_page_id
        } else {
          break
        }
      } else {
        break
      }
    }
    const reversedTransactions = allTransactions.reverse().slice(0, limit)
    return reversedTransactions
  } catch (error) {
    throw new Error(`Error in fetch ${error}`)
  }
}

function getDefaultStartDateThreeMonthsAgo(): string {
  const date = new Date()
  date.setMonth(date.getMonth() - 3)
  return date.toISOString().split('T')[0]
}
