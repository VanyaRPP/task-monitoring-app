import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { ITransactionRes } from '@components/Pages/BankTransactions/components/TransactionsTable/TransactionsTable'

export const bankApi = createApi({
  reducerPath: 'bankApi',
  tagTypes: ['Bank', 'IBank'],
  refetchOnFocus: true,
  refetchOnReconnect: true,
  baseQuery: fetchBaseQuery({ baseUrl: `/api/` }),
  endpoints: (builder) => ({
    getTransactions: builder.query<ITransactionRes, { token: string }>({
      query: ({ token }) => ({
        url: 'bankapi/transactions',
        method: 'GET',
        headers: {
          token: token,
          'Content-type': 'application/json;charset=utf-8',
        },
      }),
    }),
    getDate: builder.query<string, { token: string }>({
      query: ({ token }) => ({
        url: 'bankapi/date',
        method: 'GET',
        headers: {
          token: token,
          'Content-type': 'application/json;charset=utf-8',
        },
      }),
    }),
    getBalances: builder.query<string, { token: string }>({
      query: ({ token }) => ({
        url: 'bankapi/balances',
        method: 'GET',
        headers: {
          token: token,
          'Content-type': 'application/json;charset=utf-8',
        },
      }),
    }),
  }),
})

export const { useGetTransactionsQuery, useGetDateQuery, useGetBalancesQuery } =
  bankApi
