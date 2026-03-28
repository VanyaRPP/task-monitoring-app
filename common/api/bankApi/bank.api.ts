import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import {
  IBalance,
  IBalancesData,
} from '@components/Pages/BankTransactions/components/DomainbankBalance/DomainBankBalance'
import {
  IBankRes,
  ITransaction,
} from '@components/Pages/BankTransactions/components/TransactionsTable/components/transactionTypes'

interface IGetQuery {
  token: string
  startDate?: string
  limit?: number
  followId?: string
}

export const bankApi = createApi({
  reducerPath: 'bankApi',
  tagTypes: ['Bank', 'IBank'],
  refetchOnFocus: true,
  refetchOnReconnect: true,
  baseQuery: fetchBaseQuery({ baseUrl: `/api/bankapi/` }),
  endpoints: (builder) => ({
    getTransactions: builder.query<
      ITransaction[],
      { token: string; acc: string; domainId?: string }
    >({
      query: ({ token, acc, domainId }) => {
        const params = new URLSearchParams({ acc })
        if (domainId) params.set('domainId', domainId)
        return {
          url: `transactions?${params.toString()}`,
          method: 'GET',
          headers: {
            token,
            'Content-type': 'application/json;charset=utf-8',
          },
        }
      },
      transformResponse: (response: IBankRes<ITransaction[]>) => response.data,
    }),
    getDate: builder.query<string, { token: string }>({
      query: ({ token }) => ({
        url: 'date',
        method: 'GET',
        headers: {
          token: token,
          'Content-type': 'application/json;charset=utf-8',
        },
      }),
    }),
    getBalances: builder.query<IBalance[], IGetQuery>({
      query: ({ token }) => ({
        url: 'balances',
        method: 'GET',
        headers: {
          token: token,
          'Content-type': 'application/json;charset=utf-8',
        },
      }),
      transformResponse: (response: IBankRes<IBalancesData>) =>
        response.data.balances,
    }),
  }),
})

export const { useGetTransactionsQuery, useGetDateQuery, useGetBalancesQuery } =
  bankApi
