import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const debtorsApi = createApi({
  reducerPath: 'debtorsApi',
  refetchOnFocus: true,
  refetchOnReconnect: true,
  baseQuery: fetchBaseQuery({ baseUrl: `/api/` }),
  endpoints: (builder) => ({
    getDebtors: builder.query({
      query: (domainIds) => `debtors?domainIds=${domainIds}`,
    }),
  }),
})
export const { useGetDebtorsQuery } = debtorsApi
