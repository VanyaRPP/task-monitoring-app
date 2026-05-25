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

function dateTimeSortKey(value: string | undefined | null): string {
  if (!value || typeof value !== 'string') return ''
  const m = value.match(/^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2}):(\d{2})$/)
  if (!m) return ''
  const [, dd, mm, yyyy, hh, min, ss] = m
  return `${yyyy}${mm}${dd}${hh}${min}${ss}`
}

export function sortTransactionsNewestFirst(
  transactions: ITransaction[]
): ITransaction[] {
  return [...transactions].sort((a, b) => {
    const ka = dateTimeSortKey(a.DATE_TIME_DAT_OD_TIM_P)
    const kb = dateTimeSortKey(b.DATE_TIME_DAT_OD_TIM_P)
    if (ka !== kb) return kb.localeCompare(ka)
    return String(b.ID || '').localeCompare(String(a.ID || ''))
  })
}

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
    const finalTransactions =
      await apiPrivatAdapter.getInterimTransactions(limit)
    return finalTransactions
  } catch (error) {
    throw new Error(`Error in fetch ${error}`)
  }
}
export async function getTransactionsForDateInterval(
  token: string,
  acc: string,
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
        currentFollowId,
        undefined,
        acc
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
    return sortTransactionsNewestFirst(allTransactions)
  } catch (error) {
    throw new Error(`Error in fetch ${error}`)
  }
}
