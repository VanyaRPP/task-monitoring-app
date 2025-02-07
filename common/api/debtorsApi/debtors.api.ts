import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { IGetDebtorsResponse, IGetDebtorsRequest } from './debtors.api.types'

export const debtorsApi = createApi({
  reducerPath: 'debtorsApi',
  refetchOnFocus: true,
  refetchOnReconnect: true,
  baseQuery: fetchBaseQuery({ baseUrl: `/api/` }),
  endpoints: (builder) => ({
    getDebtors: builder.query<
    IGetDebtorsResponse,
    IGetDebtorsRequest
    >({
      query: ({ domainIds }) => {
        return {
          url: `debtors`,
          params: { domainIds },
        }
      },
    }),
  }),
})
export const { useGetDebtorsQuery } = debtorsApi
