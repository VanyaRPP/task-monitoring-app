import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import {
  IBankRes,
  ITransactionData,
} from '@components/Pages/BankTransactions/components/TransactionsTable/TransactionsTable'
import {
  IBalance,
  IBalancesData,
} from '@components/Pages/BankTransactions/components/DomainbankBalance/DomainBankBalance'

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
    getTransactions: builder.query<ITransactionData, IGetQuery>({
      query: ({ token, startDate, limit, followId }) => ({
        url: 'transactions',
        method: 'GET',
        headers: {
          token: token,
          'Content-type': 'application/json;charset=utf-8',
        },
        params: { startDate, limit, followId },
      }),
      transformResponse: (response: IBankRes<ITransactionData>) =>
        response.data,
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
    getBalances: builder.query<IBankRes<IBalancesData>, IGetQuery>({
      query: ({ token }) => ({
        url: 'balances',
        method: 'GET',
        headers: {
          token: token,
          'Content-type': 'application/json;charset=utf-8',
        },
      }),
    }),
  }),
})

export const {
  useGetTransactionsQuery,
  useLazyGetTransactionsQuery,
  useGetDateQuery,
  useGetBalancesQuery,
} = bankApi
