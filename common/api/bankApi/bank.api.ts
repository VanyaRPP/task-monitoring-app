import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import {
  IBalance,
  IBalancesData,
} from '@components/Pages/BankTransactions/components/DomainbankBalance/DomainBankBalance'
import {
  IBankRes,
  ITransaction,
} from '@components/Pages/BankTransactions/components/TransactionsTable/components/transactionTypes'

// The token never reaches the browser: every route picks the domain by
// `domainId` and uses that domain's token on the server.
interface IDomainQuery {
  domainId: string
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
      IDomainQuery & { acc: string }
    >({
      query: ({ domainId, acc }) => ({
        url: 'transactions',
        method: 'GET',
        params: { domainId, acc },
      }),
      transformResponse: (response: IBankRes<ITransaction[]>) => response.data,
    }),
    getDate: builder.query<string, IDomainQuery>({
      query: ({ domainId }) => ({
        url: 'date',
        method: 'GET',
        params: { domainId },
      }),
    }),
    getBalances: builder.query<IBalance[], IDomainQuery>({
      query: ({ domainId }) => ({
        url: 'balances',
        method: 'GET',
        params: { domainId },
      }),
      transformResponse: (response: IBankRes<IBalancesData>) =>
        response.data.balances,
    }),
  }),
})

export const { useGetTransactionsQuery, useGetDateQuery, useGetBalancesQuery } =
  bankApi
