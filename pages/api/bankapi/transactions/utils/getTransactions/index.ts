import { ITransaction } from '@components/Pages/BankTransactions/components/TransactionsTable/components/transactionTypes'
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

  let allTransactions: ITransaction[] = []
  let currentFollowId: string | undefined = followId

  try {
    while (true) {
      const response = (await apiPrivatAdapter.getTransactionsForDateInterval(
        startDate ?? getDefaultStartDate(),
        limit,
        currentFollowId
      )) as {
        transactions: ITransaction[]
        next_page_id?: string
        exist_next_page: boolean
      }

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
    const reversedTransactions = allTransactions.reverse()
    return reversedTransactions
  } catch (error) {
    throw new Error(`Error in fetch ${error}`)
  }
}
